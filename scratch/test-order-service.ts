import { getOrderDetails } from '../src/lib/services/order-service';

async function main() {
  const result = await getOrderDetails('cmpmm7z820011yf0x3pwmj71c', {
    userId: 'cmnh539j30001i46zhc8s93b3',
    role: 'CUSTOMER',
    customerId: 'cmpmksb7b000mz4hlo5mm418r'
  });
  console.log('Result actions:', result.order.actions);
}

main().catch(console.error);
