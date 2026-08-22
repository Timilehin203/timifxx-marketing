const API_BASE_URL =
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


    if (!response.ok) {

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


    if (services.length === 0) {

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


      const price =
        Number(
          service.price
        );


      const validPrice =
        Number.isFinite(
          price
        )
          ? price
          : 0;


      const priceText =
        service.price_type ===
        'starting_from'

          ? `Starting from $${validPrice.toFixed(0)}`

          : `$${validPrice.toFixed(0)}`;


      const turnaround =
        service.turnaround_text
          ? `
            <span class="turnaround">
              ${escapeHtml(
                service.turnaround_text
              )}
            </span>
          `
          : '';


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


        <div class="price">

          ${priceText}

          <small>
            USD
          </small>

        </div>


        ${turnaround}


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

        Please refresh the page and try again.

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
