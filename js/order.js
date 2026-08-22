const API_BASE_URL =
  window.TIMIFXX_API_BASE_URL ||
  document
    .querySelector(
      'meta[name="api-base-url"]'
    )
    ?.content ||
  'https://timifxx-marketing-production.up.railway.app';


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
| LOAD SERVICES
|--------------------------------------------------------------------------
*/

async function loadServices() {

  if (!serviceSelect) {
    return;
  }


  serviceSelect.innerHTML =
    '<option value="">Loading services...</option>';


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
        `Unable to load services. Server returned ${response.status}.`
      );

    }


    const data =
      await response.json();


    const services =
      Array.isArray(data.services)
        ? data.services
        : [];


    if (services.length === 0) {

      serviceSelect.innerHTML =
        '<option value="">No services available</option>';

      return;

    }


    serviceSelect.innerHTML =
      '<option value="">Select a service</option>';


    for (
      const service of services
    ) {

      const option =
        document.createElement('option');


      const price =
        Number(service.price);


      const formattedPrice =
        Number.isFinite(price)
          ? price.toFixed(0)
          : '0';


      const priceText =
        service.price_type === 'starting_from'
          ? `Starting from $${formattedPrice}`
          : `$${formattedPrice}`;


      option.value =
        service.id;


      option.textContent =
        `${service.name} — ${priceText}`;


      serviceSelect.appendChild(
        option
      );

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

      const serviceExists =
        Array.from(
          serviceSelect.options
        ).some(
          option =>
            option.value === requestedService
        );


      if (serviceExists) {

        serviceSelect.value =
          requestedService;

      }

    }

  } catch (error) {

    console.error(
      'Service loading error:',
      error
    );


    serviceSelect.innerHTML =
      '<option value="">Unable to load services</option>';


    if (message) {

      message.textContent =
        'Unable to load services. Please refresh the page and try again.';

    }

  }

}


/*
|--------------------------------------------------------------------------
| ORDER SUBMISSION
|--------------------------------------------------------------------------
|
| For now, the customer is directed to Telegram with the selected
| service and order details already prepared.
|
|--------------------------------------------------------------------------
*/

if (form) {

  form.addEventListener(
    'submit',
    function (event) {

      event.preventDefault();


      const service =
        serviceSelect.options[
          serviceSelect.selectedIndex
        ];


      const serviceName =
        service
          ? service.textContent
          : 'Not selected';


      const name =
        document
          .getElementById('name')
          .value
          .trim();


      const email =
        document
          .getElementById('email')
          .value
          .trim();


      const telegramUsername =
        document
          .getElementById('telegramUsername')
          .value
          .trim();


      const whatsapp =
        document
          .getElementById('whatsapp')
          .value
          .trim();


      const orderDetails =
        document
          .getElementById('message')
          .value
          .trim();


      if (!serviceSelect.value) {

        message.textContent =
          'Please select a service.';

        return;

      }


      if (!name) {

        message.textContent =
          'Please enter your name.';

        return;

      }


      if (!email) {

        message.textContent =
          'Please enter your email address.';

        return;

      }


      const telegramMessage =
        `Hello TimiFxx Marketing!

I would like to place an order.

Service:
${serviceName}

Name:
${name}

Email:
${email}

Telegram Username:
${telegramUsername || 'Not provided'}

WhatsApp:
${whatsapp || 'Not provided'}

Order Details:
${orderDetails || 'Not provided'}

Please let me know the next step to finalize the deal.`;


      const telegramUrl =
        `https://t.me/timifxx203?text=${encodeURIComponent(
          telegramMessage
        )}`;


      message.textContent =
        'Opening Telegram so you can finalize your order...';


      window.location.href =
        telegramUrl;

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
