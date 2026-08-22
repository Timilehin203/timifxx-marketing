const API_BASE_URL =
  window.TIMIFXX_API_BASE_URL ||
  document
    .querySelector(
      'meta[name="api-base-url"]'
    )
    ?.content ||
  'https://timifxx-marketing-production.up.railway.app';


function apiUrl(path) {

  const baseUrl =
    API_BASE_URL.replace(
      /\/$/,
      ''
    );

  return `${baseUrl}${path}`;

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
| FORMAT SERVICE PRICE
|--------------------------------------------------------------------------
*/

function formatPrice(service) {

  const price =
    Number(
      service.price
    );


  if (
    Number.isNaN(price)
  ) {

    return 'Price unavailable';

  }


  const formattedPrice =
    `$${price.toFixed(0)}`;


  if (
    service.price_type ===
    'starting_from'
  ) {

    return `Starting from ${formattedPrice}`;

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
        `Unable to load services. Status: ${response.status}`
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


      const priceText =
        formatPrice(
          service
        );


      const turnaroundText =
        service.turnaround_text
          ? escapeHtml(
              service.turnaround_text
            )
          : 'Contact us for details';


      card.innerHTML = `

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

          <span>
            ⏱ ${turnaroundText}
          </span>

        </div>


        <div class="price">

          ${escapeHtml(
            priceText
          )}

          <small>
            USD
          </small>

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

        <button
          class="button secondary retry-button"
          type="button"
          id="retryServicesButton"
        >
          Try Again
        </button>

      </div>

    `;


    const retryButton =
      document.getElementById(
        'retryServicesButton'
      );


    if (
      retryButton
    ) {

      retryButton.addEventListener(
        'click',
        loadServices
      );

    }

  }

}


/*
|--------------------------------------------------------------------------
| START APPLICATION
|--------------------------------------------------------------------------
*/

document.addEventListener(
  'DOMContentLoaded',
  () => {

    loadServices();

  }
);
