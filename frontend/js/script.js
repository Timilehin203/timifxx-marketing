const API_BASE_URL =
  window.TIMIFXX_API_BASE_URL ||
  document.querySelector('meta[name="api-base-url"]')?.content ||
  '';

function apiUrl(path) {
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
}


/*
|--------------------------------------------------------------------------
| HTML ESCAPING
|--------------------------------------------------------------------------
| Prevents backend data from being inserted into the page as raw HTML.
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


/*
|--------------------------------------------------------------------------
| LOAD SERVICES
|--------------------------------------------------------------------------
*/

async function loadServices() {

  const grid = document.getElementById('servicesGrid');

  if (!grid) {
    return;
  }

  try {

    const response = await fetch(
      apiUrl('/api/services'),
      {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      }
    );


    if (!response.ok) {
      throw new Error('Unable to load services.');
    }


    const data = await response.json();


    grid.innerHTML = '';


    const services = Array.isArray(data.services)
      ? data.services
      : [];


    if (services.length === 0) {

      grid.innerHTML = `
        <div class="loading-card">
          No services are currently available.
        </div>
      `;

      return;
    }


    for (const service of services) {

      const card = document.createElement('article');

      card.className = 'service-card';


      const price = Number(service.price);


      const priceText =
        service.price_type === 'starting_from'
          ? `Starting from $${price.toFixed(0)}`
          : `$${price.toFixed(0)}`;


      card.innerHTML = `
        <h3>
          ${escapeHtml(service.name)}
        </h3>

        <p>
          ${escapeHtml(
            service.description ||
            'Professional Telegram marketing assistance.'
          )}
        </p>

        <div class="price">
          ${priceText}
          <small>USD</small>
        </div>

        <a
          class="button secondary"
          href="order.html?service=${encodeURIComponent(service.id)}"
        >
          Order Service
        </a>
      `;


      grid.appendChild(card);
    }

  } catch (error) {

    console.error(
      'Service loading error:',
      error
    );


    grid.innerHTML = `
      <div class="loading-card">
        Unable to load services.
        Please try again.
      </div>
    `;
  }
}


/*
|--------------------------------------------------------------------------
| START
|--------------------------------------------------------------------------
*/

document.addEventListener(
  'DOMContentLoaded',
  loadServices
);
