const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ML_CLIENT_ID = process.env.ML_CLIENT_ID;
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiry = 0;

async function getMLToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials&client_id=' + ML_CLIENT_ID + '&client_secret=' + ML_CLIENT_SECRET
  });
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function sendTelegram(message) {
  await fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    })
  });
}

async function getOrderDetails(orderId, token) {
  const res = await fetch('https://api.mercadolibre.com/orders/' + orderId, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  return await res.json();
}

async function getItemDetails(itemId, token) {
  const res = await fetch('https://api.mercadolibre.com/items/' + itemId, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  return await res.json();
}

async function getPaymentDetails(paymentId, token) {
  const res = await fetch('https://api.mercadolibre.com/collections/' + paymentId, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  return await res.json();
}

async function getShipmentDetails(shipmentId, token) {
  const res = await fetch('https://api.mercadolibre.com/shipments/' + shipmentId, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  return await res.json();
}

async function getQuestionDetails(questionId, token) {
  const res = await fetch('https://api.mercadolibre.com/questions/' + questionId, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  return await res.json();
}

function formatMoney(value) {
  return 'R$ ' + Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  try {
    const notification = req.body;
    const topic = notification.topic || notification.type;
    const resourceId = (notification.resource || '').split('/').pop();

    const token = await getMLToken().catch(() => null);
    let message = '';

    if (topic === 'orders_v2' || topic === 'orders') {
      const order = await getOrderDetails(resourceId, token);
      const status = order.status;
      const item = order.order_items && order.order_items[0];
      const itemTitle = item ? item.item.title : '—';
      const qty = item ? item.quantity : 1;
      const total = order.total_amount || 0;
      const buyer = order.buyer ? order.buyer.nickname : '—';
      const payStatus = order.payments && order.payments[0] ? order.payments[0].status : '—';

      const statusEmoji = {
        'paid': '✅', 'cancelled': '❌', 'pending': '⏳',
        'confirmed': '🟢', 'invalid': '🚫'
      }[status] || '📦';

      const statusLabel = {
        'paid': 'PAGO', 'cancelled': 'CANCELADO', 'pending': 'PENDENTE',
        'confirmed': 'CONFIRMADO', 'invalid': 'INVÁLIDO'
      }[status] || status.toUpperCase();

      message = statusEmoji + ' <b>PEDIDO ' + statusLabel + '</b>\n\n' +
        '🛍 <b>Produto:</b> ' + itemTitle + '\n' +
        '📦 <b>Qtd:</b> ' + qty + '\n' +
        '💰 <b>Valor:</b> ' + formatMoney(total) + '\n' +
        '👤 <b>Comprador:</b> ' + buyer + '\n' +
        '💳 <b>Pagamento:</b> ' + payStatus + '\n' +
        '🔢 <b>Pedido #:</b> ' + resourceId;

    } else if (topic === 'payments') {
      const payment = await getPaymentDetails(resourceId, token);
      const status = payment.collection ? payment.collection.status : '—';
      const total = payment.collection ? payment.collection.total_amount : 0;

      const statusEmoji = {
        'approved': '✅', 'rejected': '❌', 'pending': '⏳', 'refunded': '↩️'
      }[status] || '💳';

      message = statusEmoji + ' <b>PAGAMENTO ' + status.toUpperCase() + '</b>\n\n' +
        '💰 <b>Valor:</b> ' + formatMoney(total) + '\n' +
        '🔢 <b>ID:</b> ' + resourceId;

    } else if (topic === 'shipments') {
      const shipment = await getShipmentDetails(resourceId, token);
      const status = shipment.status || '—';
      const substatus = shipment.substatus || '';
      const tracking = shipment.tracking_number || '—';

      const statusEmoji = {
        'ready_to_ship': '📦', 'shipped': '🚚', 'delivered': '✅',
        'not_delivered': '❌', 'cancelled': '🚫', 'handling': '🏭'
      }[status] || '📬';

      const statusLabel = {
        'ready_to_ship': 'PRONTO PARA ENVIAR', 'shipped': 'ENVIADO',
        'delivered': 'ENTREGUE', 'not_delivered': 'NÃO ENTREGUE',
        'cancelled': 'CANCELADO', 'handling': 'EM MANUSEIO'
      }[status] || status.toUpperCase();

      message = statusEmoji + ' <b>ENVIO: ' + statusLabel + '</b>\n\n' +
        (substatus ? '📋 <b>Substatus:</b> ' + substatus + '\n' : '') +
        '📮 <b>Rastreio:</b> ' + tracking + '\n' +
        '🔢 <b>Envio #:</b> ' + resourceId;

    } else if (topic === 'questions') {
      const question = await getQuestionDetails(resourceId, token);
      const text = question.text || '—';
      const buyer = question.from ? question.from.nickname || 'Comprador' : 'Comprador';

      message = '❓ <b>NOVA PERGUNTA</b>\n\n' +
        '👤 <b>De:</b> ' + buyer + '\n' +
        '💬 <b>Pergunta:</b> ' + text + '\n' +
        '🔢 <b>ID:</b> ' + resourceId;

    } else if (topic === 'items') {
      const item = await getItemDetails(resourceId, token);
      const status = item.status || '—';
      const title = item.title || '—';

      const statusEmoji = {
        'active': '🟢', 'paused': '⏸', 'closed': '🔴', 'under_review': '🔍'
      }[status] || '📋';

      message = statusEmoji + ' <b>ANÚNCIO ATUALIZADO</b>\n\n' +
        '📝 <b>Título:</b> ' + title + '\n' +
        '📊 <b>Status:</b> ' + status + '\n' +
        '🔢 <b>ID:</b> ' + resourceId;

    } else if (topic === 'claims') {
      message = '⚠️ <b>RECLAMAÇÃO RECEBIDA</b>\n\n' +
        '🔢 <b>ID:</b> ' + resourceId + '\n' +
        '⚡ Verifique no Mercado Livre!';

    } else if (topic === 'reviews') {
      message = '⭐ <b>NOVA AVALIAÇÃO</b>\n\n' +
        '🔢 <b>ID:</b> ' + resourceId + '\n' +
        '👉 Verifique no Mercado Livre!';

    } else {
      message = '🔔 <b>NOTIFICAÇÃO ML</b>\n\n' +
        '📌 <b>Tipo:</b> ' + topic + '\n' +
        '🔢 <b>ID:</b> ' + resourceId;
    }

    if (message) await sendTelegram(message);
    res.status(200).json({ ok: true });

  } catch(e) {
    console.error('Webhook error:', e);
    res.status(200).json({ ok: true }); // Always return 200 to ML
  }
}
