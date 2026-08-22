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
    API_BASE_URL.replace(
      /\/$/,
      ''
    ) + path
  );

}


/*
|--------------------------------------------------------------------------
| HTML ESCAPING
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {

  return String(value ?? '')
    .replaceAll(
      '&',
      '&amp;'
    )
    .replaceAll(
      '<',
      '&lt;'
    )
    .replaceAll(
      '>',
      '&gt;'
    )
    .replaceAll(
      '"',
      '&quot;'
    )
    .replaceAll(
      "'",
      '&#039;'
    );

}


/*
|--------------------------------------------------------------------------
| SERVICE AVATARS
|--------------------------------------------------------------------------
|
| Each service has its own unique visual avatar.
|
*/

function getServiceAvatar(slug) {

  const avatars = {

    'already-approved-channel':
      '📢',

    'already-approved-bot':
      '🤖',

    'already-approved-miniapp':
      '📱',

    'approval-assistance':
      '✓',

    'ad-setup':
      '📣',

    'ad-copy-creation':
      '✍',

    'campaign-management':
      '📊',

    'declined-review':
      '🔍',

    'destination-compliance':
      '🛡',

    'campaign-audit':
      '📈'

  };


  return (
    avatars[slug] ||
    'T'
  );

}


/*
|--------------------------------------------------------------------------
| PRICE FORMATTER
|--------------------------------------------------------------------------
*/

function formatPrice(service) {

  const price =
    Number(service.price);


  if (
    !Number.isFinite(price)
  ) {

    return 'Contact us';

  }


  const formattedPrice =
    `$${price.toFixed(0)}`;


  if (
    service.price_type ===
    'starting_from'
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
        apiUrl(
          '/api/services'
        ),
        {

          method: 'GET',

          headers: {

            Accept:
              'application/json'

          }

        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        'Unable to load services.'
      );

    }


    const data =
      await response.json();


    const services =
      Array.isArray(
        data.services
      )
        ? data.services
        : [];


    grid.innerHTML = '';


    if (
      services.length === 0
    ) {

      grid.innerHTML = `

        <div class="loading-card">

          No services are currently available.

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
          service.slug
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

          ${escapeHtml(avatar)}

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


        <div class="service-meta">

          <div class="price">

            ${escapeHtml(
              priceText
            )}

            <small>
              USD
            </small>

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
          href="order.html?service=${encodeURIComponent(
            service.id
          )}"
        >

          Order Service

        </a>

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

        Unable to load services.

        <br>

        Please refresh and try again.

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
