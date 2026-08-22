const API_BASE_URL =
  window.TIMIFXX_API_BASE_URL ||
  document
    .querySelector(
      'meta[name="api-base-url"]'
    )
    ?.content ||
  'https://timifxx-marketing-production.up.railway.app';


function apiUrl(path) {

  return (
    `${API_BASE_URL.replace(/\/$/, '')}${path}`
  );

}


/*
|--------------------------------------------------------------------------
| HTML ESCAPING
|--------------------------------------------------------------------------
|
| Prevents backend data from being inserted into the page as raw HTML.
|
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
| SERVICE AVATARS
|--------------------------------------------------------------------------
|
| Each service receives its own visual icon.
|
|--------------------------------------------------------------------------
*/

function getServiceAvatar(service) {

  const slug =
    String(service.slug || '')
      .toLowerCase();


  const name =
    String(service.name || '')
      .toLowerCase();


  if (
    slug.includes('channel') ||
    name.includes('channel')
  ) {

    return '📢';

  }


  if (
    slug.includes('bot') ||
    name.includes('bot')
  ) {

    return '🤖';

  }


  if (
    slug.includes('miniapp') ||
    slug.includes('mini-app') ||
    name.includes('mini app')
  ) {

    return '📱';

  }


  if (
    slug.includes('approval') ||
    name.includes('approval')
  ) {

    return '✅';

  }


  if (
    slug.includes('setup') ||
    name.includes('setup')
  ) {

    return '⚙️';

  }


  if (
    slug.includes('copy') ||
    name.includes('copy')
  ) {

    return '✍️';

  }


  if (
    slug.includes('management') ||
    name.includes('management')
  ) {

    return '📈';

  }


  if (
    slug.includes('declined') ||
    name.includes('declined')
  ) {

    return '🔍';

  }


  if (
    slug.includes('compliance') ||
    name.includes('compliance')
  ) {

    return '🛡️';

  }


  if (
    slug.includes('audit') ||
    name.includes('audit')
  ) {

    return '📊';

  }


  return '🚀';

}


/*
|--------------------------------------------------------------------------
| PRICE FORMATTING
|--------------------------------------------------------------------------
*/

function formatPrice(service) {

  const price =
    Number(service.price);


  if (
    Number.isNaN(price)
  ) {

    return 'Contact us';

  }


  const formattedPrice =
    `$${price.toFixed(0)}`;


  if (
    service.price_type === 'starting_from'
  ) {

    return (
      `Starting from ${formattedPrice}`
    );

  }


  return formattedPrice;

}


/*
|--------------------------------------------------------------------------
| LOAD SERVICES
|--------------------------------------------------------------------------
*/

async function loadServices() {

  const grid =
    document.getElementById(
      'servicesGrid'
    );


  if (!grid) {
    return;
  }


  try {

    const response =
      await fetch(
        apiUrl('/api/services'),
        {
          method: 'GET',

          headers: {
            Accept: 'application/json'
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        'Unable to load services.'
      );

    }


    const data =
      await response.json();


    const services =
      Array.isArray(data.services)
        ? data.services
        : [];


    grid.innerHTML = '';


    if (
      services.length === 0
    ) {

      grid.innerHTML = `
        <div class="loading-card">

          <span>
            No services are currently available.
          </span>

        </div>
      `;

      return;

    }


    for (
      const service of services
    ) {

      const card =
        document.createElement(
          'article'
        );


      card.className =
        'service-card';


      const avatar =
        getServiceAvatar(
          service
        );


      const priceText =
        formatPrice(
          service
        );


      const turnaround =
        service.turnaround_text ||
        'Contact for details';


      card.innerHTML = `

        <div class="service-avatar">

          ${avatar}

        </div>


        <h3>

          ${escapeHtml(
            service.name
          )}

        </h3>


        <p>

          ${escapeHtml(
            service.description ||
            'Professional Telegram marketing assistance.'
          )}

        </p>


        <div class="service-bottom">


          <div class="service-meta">


            <div class="price">

              ${escapeHtml(
                priceText
              )}

              ${
                priceText !==
                'Contact us'
                  ? '<small>USD</small>'
                  : ''
              }

            </div>


            <div class="turnaround">

              <strong>
                Turnaround
              </strong>

              ${escapeHtml(
                turnaround
              )}

            </div>


          </div>


          <a
            class="button secondary"
            href="order.html?service=${encodeURIComponent(service.id)}"
          >

            Order Service

          </a>


        </div>

      `;


      grid.appendChild(
        card
      );

    }

  } catch (error) {

    console.error(
      'Service loading error:',
      error
    );


    grid.innerHTML = `

      <div class="loading-card">

        <span>
          Unable to load services.
        </span>

        <small>
          Please refresh the page and try again.
        </small>

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
  () => {

    loadServices();

  }
);
