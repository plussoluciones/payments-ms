import { Injectable } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecretKey);

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;

    const lineItems = items.map((item) => {
      return {
        price_data: {
          currency: currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // 20 usd 2000/100=20
        },
        quantity: item.quantity,
      };
    });

    const session = await this.stripe.checkout.sessions.create({
      //colocar aqui el ID de mi orden
      payment_intent_data: {
        metadata: {
          orderId,
        },
      },

      line_items: lineItems,
      mode: 'payment',
      success_url: 'http://localhost:3000/payments/success',
      cancel_url: 'http://localhost:3000/payments/cancelled',
    });
    return session;
  }

  async stripeWebHook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    //testing
    // const endpointSecret =
    //   'whsec_1dd287319e3e49de9c5860b55df6f775575fa8ce2aaf080c8edc7718cef99992';
    const endpointSecret = 'whsec_h5XUdfLVSD6rf7xMCGOngRcgbW8Gn6eZ';

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        endpointSecret,
      );
    } catch (error) {
      res.status(400).send(`Webhook Error: ${error.message}`);
    }

    switch (event.type) {
      case 'charge.succeeded':
        const chargeSuccessded = event.data.object;
        //llamar al microservicios
        console.log({ orderId: chargeSuccessded.metadata.orderId });
        break;
      default:
        console.log(`Event ${event.type} not handled`);
        break;
    }

    return res.status(200).json({ sig });
  }
}
