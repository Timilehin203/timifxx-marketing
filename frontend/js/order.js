const API_BASE_URL =
  window.TIMIFXX_API_BASE_URL ||
  document.querySelector('meta[name="api-base-url"]')?.content ||
  '';

function apiUrl(path) {
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
}


/*
|--------------------------------------------------------------------------
| ELEMENTS
|--------------------------------------------------------------------------
*/

const serviceSelect =
  document.getElementById('serviceId');

const form =
  document.getElementById('orderForm');

const message =
  document.getElementById('formMessage');


/*
|--------------------------------------------------------------------------
| ESCAPE HTML
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

  if (!serviceSelect) {
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
      throw new Error(
        'Unable to load services.'
      );
    }


    const data = await response.json();


    const services = Array.isArray(data.services)
      ? data.services
      : [];


    serviceSelect.innerHTML =
      '<option value="">Select a service</option>';


    for (const service of services) {

      const option =
        document.createElement('option');


      const price =
        Number(service.price);


      const priceText =
        service.price_type === 'starting_from'
          ? `Starting from $${price.toFixed(0)}`
          : `$${price.toFixed(0)}`;


      option.value = service.id;


      option.textContent =
        `${service.name} — ${priceText}`;


      serviceSelect.appendChild(option);
    }


    /*
    |--------------------------------------------------------------------------
    | PRESELECT SERVICE
    |--------------------------------------------------------------------------
    */

    const requestedService =
      new URLSearchParams(
        window.location.search
      ).get('service');


    if (requestedService) {

      serviceSelect.value =
        requestedService;
    }

  } catch (error) {

    console.error(
      'Service loading error:',
      error
    );


    serviceSelect.innerHTML =
      '<option value="">Unable to load services</option>';
  }
}


/*
|--------------------------------------------------------------------------
| ORDER SUBMISSION
|--------------------------------------------------------------------------
|
| Stage 1:
| The form is prepared but actual order creation will be connected
| when the backend order endpoint is implemented.
|
|--------------------------------------------------------------------------
*/

if (form) {

  form.addEventListener(
    'submit',
    function (event) {

      event.preventDefault();


      message.textContent =
        'Order submission will be connected in Stage 2.';
    }
  );
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
