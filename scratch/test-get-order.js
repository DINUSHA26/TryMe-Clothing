const { getOrderDetails } = require('../src/lib/services/order-service');

async function main() {
  const result = await getOrderDetails('cmpmm7z820011yf0x3pwmj71c', {
    userId: 'cmnh539j30001i46zhc8s93b3', // customer userId
    role: 'CUSTOMER',
    customerId: 'cmpmksb7b000mz4hlo5mm418r'
  });
  console.log(JSON.stringify(result.order.actions, null, 2));
}

main().catch(console.error);
