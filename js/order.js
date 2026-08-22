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


const submitButton =
  form
    ? form.querySelector(
        'button[type="submit"]'
      )
    : null;


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
        'Unable to load services.'
      );

    }


    const data =
      await response.json();


    const services =
      Array.isArray(data.services)
        ? data.services
        : [];


    if (
      services.length === 0
    ) {

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
        document.createElement(
          'option'
        );


      const price =
        Number(
          service.price
        );


      const formattedPrice =
        Number.isFinite(price)
          ? price.toFixed(0)
          : '0';


      const priceText =
        service.price_type ===
        'starting_from'
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


    if (
      requestedService
    ) {

      const serviceExists =
        Array.from(
          serviceSelect.options
        ).some(
          option =>
            option.value ===
            requestedService
        );


      if (
        serviceExists
      ) {

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


    if (
      message
    ) {

      message.textContent =
        'Unable to load services. Please refresh and try again.';

    }

  }

}


/*
|--------------------------------------------------------------------------
| CREATE ORDER
|--------------------------------------------------------------------------
*/

async function createOrder(
  orderData
) {

  const response =
    await fetch(
      apiUrl('/api/orders'),
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          Accept:
            'application/json'
        },

        body:
          JSON.stringify(
            orderData
          )
      }
    );


  const data =
    await response.json()
      .catch(
        () => ({
          success: false,
          message:
            'Invalid server response.'
        })
      );


  if (
    !response.ok ||
    !data.success
  ) {

    throw new Error(
      data.message ||
      'Unable to create order.'
    );

  }


  return data;

}


/*
|--------------------------------------------------------------------------
| ORDER SUBMISSION
|--------------------------------------------------------------------------
*/

if (
  form
) {

  form.addEventListener(
    'submit',
    async function (
      event
    ) {

      event.preventDefault();


      if (
        !serviceSelect.value
      ) {

        message.textContent =
          'Please select a service.';

        return;

      }


      const orderData = {

        serviceId:
          Number(
            serviceSelect.value
          ),

        name:
          document
            .getElementById('name')
            .value
            .trim(),

        email:
          document
            .getElementById('email')
            .value
            .trim(),

        telegramUsername:
          document
            .getElementById(
              'telegramUsername'
            )
            .value
            .trim(),

        whatsapp:
          document
            .getElementById(
              'whatsapp'
            )
            .value
            .trim(),

        message:
          document
            .getElementById('message')
            .value
            .trim()

      };


      try {

        if (
          submitButton
        ) {

          submitButton.disabled =
            true;


          submitButton.textContent =
            'Creating Order...';

        }


        message.textContent =
          'Creating your order...';


        const data =
          await createOrder(
            orderData
          );


        const order =
          data.order;


        /*
        |--------------------------------------------------------------------------
        | SAVE ORDER NUMBER
        |--------------------------------------------------------------------------
        */

        localStorage.setItem(
          'timifxx_latest_order',
          order.order_number
        );


        message.textContent =
          `Order created successfully. Your order number is ${order.order_number}. Redirecting you to Telegram...`;


        /*
        |--------------------------------------------------------------------------
        | TELEGRAM MESSAGE
        |--------------------------------------------------------------------------
        */

        const telegramMessage =
          `Hello TimiFxx Marketing!

I have created a new order.

Order Number:
${order.order_number}

Service:
${order.service_name}

Order Status:
${order.status}

Please let me know the next step to finalize my order.`;


        const telegramUrl =
          `https://t.me/timifxx203?text=${encodeURIComponent(
            telegramMessage
          )}`;


        /*
        |--------------------------------------------------------------------------
        | REDIRECT TO TELEGRAM
        |--------------------------------------------------------------------------
        */

        setTimeout(
          () => {

            window.location.href =
              telegramUrl;

          },
          1500
        );

      } catch (
        error
      ) {

        console.error(
          'Order creation error:',
          error
        );


        message.textContent =
          error.message ||
          'Unable to create your order. Please try again.';


        if (
          submitButton
        ) {

          submitButton.disabled =
            false;


          submitButton.textContent =
            'Continue to Telegram';

        }

      }

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
