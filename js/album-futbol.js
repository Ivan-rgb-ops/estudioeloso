(function () {
  const numbersByCategory = {
    '2020': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 17, 20, 22, 30],
    '2019': [1, 3, 4, 6, 7, 8, 9, 10, 12, 15, 18, 21, 23, 27, 31]
  };

  const photosPerNumber = 4;

  // --- CONFIGURACIÓN DEL CARRITO ---
  const WHATSAPP_NUMBER = '5491100000000'; // Reemplazar con el número real de la tienda (ej: 54911xxxxxxxx)
  const PHOTO_PRICE = 1500; // Precio de cada foto en ARS
  const MP_BACKEND_URL = ''; // URL de tu backend para generar la preferencia (dejar vacío para usar WhatsApp checkout)

  // --- ESTADO DEL CARRITO ---
  let cart = [];
  try {
    const savedCart = localStorage.getItem('estudio_oso_cart');
    if (savedCart) {
      cart = JSON.parse(savedCart);
    }
  } catch (e) {
    console.error('Error cargando el carrito desde localStorage', e);
  }

  function saveCart() {
    try {
      localStorage.setItem('estudio_oso_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Error guardando el carrito en localStorage', e);
    }
    updateCartUI();
  }

  function isInCart(photoPath) {
    return cart.some(item => item.path === photoPath);
  }

  function toggleCartItem(photo) {
    const index = cart.findIndex(item => item.path === photo.path);
    let selected = false;
    if (index > -1) {
      cart.splice(index, 1);
    } else {
      cart.push(photo);
      selected = true;
    }
    saveCart();

    // Actualizar elementos visuales en la grilla sin reordenar
    const cards = document.querySelectorAll(`.album-card[data-src="${photo.path}"]`);
    cards.forEach(card => {
      card.classList.toggle('is-selected', selected);
      const btn = card.querySelector('.album-card-cart-btn');
      if (btn) {
        btn.classList.toggle('is-selected', selected);
        btn.innerHTML = selected ? '✓' : '＋';
        btn.title = selected ? 'Quitar del carrito' : 'Agregar al carrito';
      }
    });

    // Actualizar botón en el Lightbox si corresponde
    updateLightboxCartButton(photo.path);
  }

  // --- ELEMENTOS DEL CARRITO EN EL DOM ---
  const cartWidget = document.createElement('div');
  cartWidget.className = 'album-cart-widget';
  cartWidget.innerHTML = `
    <button class="album-cart-toggle" type="button" aria-label="Ver carrito">
      <span class="album-cart-icon">🛒</span>
      <span class="album-cart-badge">0</span>
    </button>
  `;
  document.body.appendChild(cartWidget);

  const cartDrawer = document.createElement('div');
  cartDrawer.className = 'album-cart-drawer';
  cartDrawer.innerHTML = `
    <div class="album-cart-drawer-overlay"></div>
    <div class="album-cart-drawer-content">
      <div class="album-cart-drawer-header">
        <h2>Tus Fotos Seleccionadas</h2>
        <button class="album-cart-drawer-close" type="button" aria-label="Cerrar carrito">×</button>
      </div>
      <div class="album-cart-drawer-body">
        <div class="album-cart-empty">Tu carrito está vacío. ¡Elegí tus fotos favoritas de la galería!</div>
        <ul class="album-cart-items"></ul>
      </div>
      <div class="album-cart-drawer-footer">
        <div class="album-cart-summary">
          <span>Total:</span>
          <span class="album-cart-total">$0</span>
        </div>
        <div class="album-cart-actions">
          <button class="album-cart-btn-primary album-cart-btn-whatsapp" type="button">
            <svg class="whatsapp-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Pedir por WhatsApp
          </button>
          <button class="album-cart-btn-secondary album-cart-btn-mercadopago" type="button">
            Pagar con Mercado Pago
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(cartDrawer);

  // --- MODAL DE MERCADO PAGO FALLBACK ---
  const mpModal = document.createElement('div');
  mpModal.className = 'album-mp-modal';
  mpModal.innerHTML = `
    <div class="album-mp-modal-overlay"></div>
    <div class="album-mp-modal-content">
      <button class="album-mp-modal-close" type="button" aria-label="Cerrar modal">×</button>
      <div class="album-mp-modal-header">
        <span class="mp-logo">Mercado Pago</span>
        <h3>Pago de las fotos</h3>
      </div>
      <div class="album-mp-modal-body">
        <p>Para pagar tus <strong class="album-mp-modal-count">0</strong> fotos mediante <strong>Mercado Pago</strong>:</p>
        <div class="mp-info-box">
          <p class="mp-total-line">Monto Total: <strong class="album-mp-modal-total">$0</strong></p>
          <ol>
            <li>Continuá el pedido por WhatsApp para pasarnos tus datos.</li>
            <li>Te enviaremos el link de pago de Mercado Pago por el total exacto.</li>
            <li>Una vez acreditado, te enviaremos todas las imágenes en alta resolución.</li>
          </ol>
        </div>
      </div>
      <div class="album-mp-modal-footer">
        <button class="album-mp-modal-btn-wa" type="button">Continuar por WhatsApp</button>
      </div>
    </div>
  `;
  document.body.appendChild(mpModal);

  const cartToggle = cartWidget.querySelector('.album-cart-toggle');
  const cartBadge = cartWidget.querySelector('.album-cart-badge');
  const cartClose = cartDrawer.querySelector('.album-cart-drawer-close');
  const cartOverlay = cartDrawer.querySelector('.album-cart-drawer-overlay');
  const cartItemsList = cartDrawer.querySelector('.album-cart-items');
  const cartTotalVal = cartDrawer.querySelector('.album-cart-total');
  const cartEmptyMsg = cartDrawer.querySelector('.album-cart-empty');
  const btnWhatsapp = cartDrawer.querySelector('.album-cart-btn-whatsapp');
  const btnMercadopago = cartDrawer.querySelector('.album-cart-btn-mercadopago');

  const mpModalClose = mpModal.querySelector('.album-mp-modal-close');
  const mpModalOverlay = mpModal.querySelector('.album-mp-modal-overlay');
  const mpModalBtnWa = mpModal.querySelector('.album-mp-modal-btn-wa');
  const mpModalCount = mpModal.querySelector('.album-mp-modal-count');
  const mpModalTotal = mpModal.querySelector('.album-mp-modal-total');

  function formatCurrency(value) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);
  }

  function updateCartUI() {
    const countVal = cart.length;
    if (cartBadge) {
      cartBadge.textContent = countVal;
    }

    if (countVal > 0) {
      cartWidget.classList.add('is-visible');
    } else {
      cartWidget.classList.remove('is-visible');
    }

    if (countVal === 0) {
      cartEmptyMsg.style.display = 'block';
      cartItemsList.innerHTML = '';
      const footer = cartDrawer.querySelector('.album-cart-drawer-footer');
      if (footer) footer.style.display = 'none';
    } else {
      cartEmptyMsg.style.display = 'none';
      const footer = cartDrawer.querySelector('.album-cart-drawer-footer');
      if (footer) footer.style.display = 'block';

      cartItemsList.innerHTML = cart.map((item, idx) => `
        <li class="album-cart-item">
          <img class="album-cart-item-thumb" src="${item.path}" alt="${item.title}">
          <div class="album-cart-item-info">
            <span class="album-cart-item-title">${item.title}</span>
            <span class="album-cart-item-meta">Cat. ${item.category} / ${item.number ? `Nº ${item.number}` : 'Foto'} ${item.photo}</span>
            <span class="album-cart-item-price">${formatCurrency(PHOTO_PRICE)}</span>
          </div>
          <button class="album-cart-item-remove" type="button" aria-label="Eliminar" data-index="${idx}">×</button>
        </li>
      `).join('');

      const total = countVal * PHOTO_PRICE;
      cartTotalVal.textContent = formatCurrency(total);
    }
  }

  function openCartDrawer() {
    cartDrawer.classList.add('is-open');
    document.body.classList.add('album-cart-open');
  }

  function closeCartDrawer() {
    cartDrawer.classList.remove('is-open');
    document.body.classList.remove('album-cart-open');
  }

  function openMpModal() {
    mpModalCount.textContent = cart.length;
    mpModalTotal.textContent = formatCurrency(cart.length * PHOTO_PRICE);
    mpModal.classList.add('is-open');
  }

  function closeMpModal() {
    mpModal.classList.remove('is-open');
  }
  const general2020Photos = Array.from({ length: 54 }, (_, index) => ({
    category: '2020',
    number: null,
    photo: index + 1,
    title: 'Album 2020',
    path: `albums/2020/general/album-2020-${String(index + 1).padStart(2, '0')}.webp`
  }));

  const customPhotos = {
    '2020': {
      7: Array.from({ length: 13 }, (_, index) => ({
        category: '2020',
        number: 7,
        photo: index + 1,
        title: 'Numero 7',
        path: `albums/2020/7/numero-7-${String(index + 1).padStart(2, '0')}.webp`
      }))
    }
  };
  let activeCategory = '2020';

  const tabs = document.querySelectorAll('.album-tab');
  const search = document.getElementById('numberSearch');
  const grid = document.getElementById('albumGrid');
  const empty = document.getElementById('albumEmpty');
  const status = document.getElementById('albumStatus');
  const count = document.getElementById('albumCount');
  const lightbox = document.createElement('div');
  lightbox.className = 'album-lightbox';
  lightbox.innerHTML = `
    <button class="album-lightbox-close" type="button" aria-label="Cerrar foto">×</button>
    <button class="album-lightbox-nav album-lightbox-prev" type="button" aria-label="Foto anterior">‹</button>
    <img class="album-lightbox-img" alt="">
    <button class="album-lightbox-cart-btn" type="button">Agregar al carrito</button>
    <button class="album-lightbox-nav album-lightbox-next" type="button" aria-label="Foto siguiente">›</button>
    <div class="album-lightbox-caption"></div>
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector('.album-lightbox-img');
  const lightboxCaption = lightbox.querySelector('.album-lightbox-caption');
  const lightboxClose = lightbox.querySelector('.album-lightbox-close');
  const lightboxPrev = lightbox.querySelector('.album-lightbox-prev');
  const lightboxNext = lightbox.querySelector('.album-lightbox-next');
  const lightboxCartBtn = lightbox.querySelector('.album-lightbox-cart-btn');

  function updateLightboxCartButton(src) {
    if (!lightboxCartBtn) return;
    const isSelected = isInCart(src);
    if (isSelected) {
      lightboxCartBtn.innerHTML = `✓ En el Carrito`;
      lightboxCartBtn.classList.add('is-selected');
    } else {
      lightboxCartBtn.innerHTML = `＋ Agregar al Carrito`;
      lightboxCartBtn.classList.remove('is-selected');
    }
  }
  let visiblePhotos = [];
  let activePhotoIndex = 0;

  function shufflePhotos(photos) {
    return [...photos].sort(() => Math.random() - 0.5);
  }

  function buildPhotos(category) {
    if (category === '2020') {
      return [
        ...customPhotos['2020'][7],
        ...general2020Photos
      ];
    }

    return numbersByCategory[category].flatMap((number) => {
      if (customPhotos[category]?.[number]) {
        return customPhotos[category][number];
      }

      return Array.from({ length: photosPerNumber }, (_, index) => ({
        category,
        number,
        photo: index + 1,
        title: `Camiseta ${number}`,
        path: `albums/${category}/${number}/foto-${String(index + 1).padStart(2, '0')}.webp`
      }));
    });
  }

  function render() {
    const query = search.value.trim();
    const numberQuery = query.match(/\d+/)?.[0] || '';
    const photos = shufflePhotos(
      buildPhotos(activeCategory).filter((item) => {
        return numberQuery === '' || String(item.number) === numberQuery;
      })
    );
    visiblePhotos = photos;

    status.textContent = `Categoria ${activeCategory} - ${numberQuery ? `camiseta ${numberQuery}` : 'todos los numeros'}`;
    count.textContent = `${photos.length} fotos`;
    empty.classList.toggle('is-visible', photos.length === 0);

    grid.innerHTML = photos.map((item) => {
      const selected = isInCart(item.path);
      return `
        <article class="album-card ${selected ? 'is-selected' : ''}" role="button" tabindex="0" data-index="${photos.indexOf(item)}" data-src="${item.path}" data-title="${item.title}" data-meta="Categoria ${item.category} / ${item.number ? `Numero ${item.number}` : 'Foto'} ${item.photo}">
          <div class="album-thumb">
            ${item.path ? `<img src="${item.path}" alt="${item.title} - foto ${item.photo}" loading="lazy">` : item.number}
            <button class="album-card-cart-btn ${selected ? 'is-selected' : ''}" type="button" aria-label="Agregar al carrito" title="${selected ? 'Quitar del carrito' : 'Agregar al carrito'}">${selected ? '✓' : '＋'}</button>
          </div>
          <div class="album-card-body">
            <div class="album-card-title">${item.title}</div>
            <div class="album-card-meta">Categoria ${item.category} / ${item.number ? `Numero ${item.number}` : 'Foto'} ${item.photo}</div>
          </div>
        </article>
      `;
    }).join('');
  }

  function showPhoto(index) {
    if (!visiblePhotos.length) return;
    activePhotoIndex = (index + visiblePhotos.length) % visiblePhotos.length;
    const photo = visiblePhotos[activePhotoIndex];
    const src = photo.path;
    if (!src) return;

    lightboxImg.src = src;
    lightboxImg.alt = `${photo.title} - foto ${photo.photo}`;
    lightboxCaption.textContent = `Categoria ${photo.category} / ${photo.number ? `Numero ${photo.number}` : 'Foto'} ${photo.photo}`;
    updateLightboxCartButton(src);
  }

  function openLightbox(card) {
    showPhoto(Number(card.dataset.index || 0));
    lightbox.classList.add('is-open');
    document.body.classList.add('album-lightbox-open');
  }

  function changePhoto(direction) {
    showPhoto(activePhotoIndex + direction);
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('album-lightbox-open');
    lightboxImg.removeAttribute('src');
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      activeCategory = tab.dataset.category;
      tabs.forEach((item) => item.classList.toggle('is-active', item === tab));
      render();
    });
  });

  search.addEventListener('input', render);

  grid.addEventListener('click', (event) => {
    const cartBtn = event.target.closest('.album-card-cart-btn');
    if (cartBtn) {
      event.stopPropagation();
      const card = cartBtn.closest('.album-card');
      if (card) {
        const index = Number(card.dataset.index);
        const photo = visiblePhotos[index];
        if (photo) toggleCartItem(photo);
      }
      return;
    }

    const card = event.target.closest('.album-card');
    if (card) openLightbox(card);
  });

  grid.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('.album-card');
    if (!card) return;
    event.preventDefault();
    openLightbox(card);
  });

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox || event.target === lightboxClose) {
      closeLightbox();
    }
  });
  lightboxPrev.addEventListener('click', () => changePhoto(-1));
  lightboxNext.addEventListener('click', () => changePhoto(1));

  lightboxCartBtn.addEventListener('click', () => {
    const photo = visiblePhotos[activePhotoIndex];
    if (photo) {
      toggleCartItem(photo);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      changePhoto(-1);
    } else if (event.key === 'ArrowRight') {
      changePhoto(1);
    }
  });

  // --- CONFIGURACIÓN DE EVENT LISTENERS DEL CARRITO ---
  cartToggle.addEventListener('click', openCartDrawer);
  cartClose.addEventListener('click', closeCartDrawer);
  cartOverlay.addEventListener('click', closeCartDrawer);

  cartItemsList.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('.album-cart-item-remove');
    if (removeBtn) {
      const idx = Number(removeBtn.dataset.index);
      const photo = cart[idx];
      if (photo) {
        toggleCartItem(photo);
      }
    }
  });

  btnWhatsapp.addEventListener('click', () => {
    if (cart.length === 0) return;

    let message = `Hola Estudio El Oso! Me gustaría comprar las siguientes fotos del álbum de Fútbol Infantil:\n\n`;
    cart.forEach((item, idx) => {
      message += `${idx + 1}. Categoria ${item.category} - ${item.title} (${item.number ? `Camiseta ${item.number}` : 'Foto'} #${item.photo}) - ${item.path}\n`;
    });
    const total = cart.length * PHOTO_PRICE;
    message += `\nTotal de fotos: ${cart.length}\nTotal a pagar: ${formatCurrency(total)}\n\nMuchas gracias!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  });

  btnMercadopago.addEventListener('click', () => {
    if (cart.length === 0) return;

    if (MP_BACKEND_URL) {
      btnMercadopago.disabled = true;
      btnMercadopago.textContent = 'Procesando...';

      fetch(MP_BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            title: `${item.title} - Cat. ${item.category} / ${item.number ? `Nº ${item.number}` : 'Foto'} ${item.photo}`,
            quantity: 1,
            unit_price: PHOTO_PRICE,
            id: item.path
          }))
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.init_point) {
          window.location.href = data.init_point;
        } else {
          throw new Error('No init_point returned');
        }
      })
      .catch(err => {
        console.error('Error al iniciar el pago con Mercado Pago:', err);
        openMpModal();
      })
      .finally(() => {
        btnMercadopago.disabled = false;
        btnMercadopago.textContent = 'Pagar con Mercado Pago';
      });
    } else {
      openMpModal();
    }
  });

  mpModalClose.addEventListener('click', closeMpModal);
  mpModalOverlay.addEventListener('click', closeMpModal);
  mpModalBtnWa.addEventListener('click', () => {
    closeMpModal();
    btnWhatsapp.click();
  });

  // Inicializar interfaz con el carrito cargado
  updateCartUI();
  render();
})();
