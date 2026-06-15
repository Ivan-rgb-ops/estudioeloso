(function () {
  const numbersByCategory = {
    '2020': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 17, 20, 22, 30],
    '2019': [1, 3, 4, 6, 7, 8, 9, 10, 12, 15, 18, 21, 23, 27, 31]
  };

  const photosPerNumber = 4;
  const general2020Photos = Array.from({ length: 54 }, (_, index) => ({
    category: '2020',
    number: null,
    photo: index + 1,
    title: 'Album 2020',
    path: `albums/2020/general/album-2020-${String(index + 1).padStart(2, '0')}.jpg`
  }));

  const customPhotos = {
    '2020': {
      7: Array.from({ length: 13 }, (_, index) => ({
        category: '2020',
        number: 7,
        photo: index + 1,
        title: 'Numero 7',
        path: `albums/2020/7/numero-7-${String(index + 1).padStart(2, '0')}.jpg`
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
    <button class="album-lightbox-close" type="button" aria-label="Cerrar foto">x</button>
    <button class="album-lightbox-nav album-lightbox-prev" type="button" aria-label="Foto anterior">‹</button>
    <img class="album-lightbox-img" alt="">
    <button class="album-lightbox-nav album-lightbox-next" type="button" aria-label="Foto siguiente">›</button>
    <div class="album-lightbox-caption"></div>
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector('.album-lightbox-img');
  const lightboxCaption = lightbox.querySelector('.album-lightbox-caption');
  const lightboxClose = lightbox.querySelector('.album-lightbox-close');
  const lightboxPrev = lightbox.querySelector('.album-lightbox-prev');
  const lightboxNext = lightbox.querySelector('.album-lightbox-next');
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
        path: `albums/${category}/${number}/foto-${String(index + 1).padStart(2, '0')}.jpg`
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

    grid.innerHTML = photos.map((item) => `
      <article class="album-card" role="button" tabindex="0" data-index="${photos.indexOf(item)}" data-src="${item.path}" data-title="${item.title}" data-meta="Categoria ${item.category} / ${item.number ? `Numero ${item.number}` : 'Foto'} ${item.photo}">
        <div class="album-thumb">
          ${item.path ? `<img src="${item.path}" alt="${item.title} - foto ${item.photo}" loading="lazy">` : item.number}
        </div>
        <div class="album-card-body">
          <div class="album-card-title">${item.title}</div>
          <div class="album-card-meta">Categoria ${item.category} / ${item.number ? `Numero ${item.number}` : 'Foto'} ${item.photo}</div>
        </div>
      </article>
    `).join('');
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
  render();
})();
