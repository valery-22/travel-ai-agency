import Stripe from 'stripe';

// Ensure the secret key is available
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
});

export const createProduct = async (
    name: string,
    description: string,
    images: string[],
    price: number,
    tripId: string
) => {
    const product = await stripe.products.create({
        name,
        description,
        images,
    });

    const priceObject = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(price * 100), // in cents
        currency: 'usd',
    });

    // Use only process.env for server-side code
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: priceObject.id, quantity: 1 }],
        metadata: { tripId },
        after_completion: {
            type: 'redirect',
            redirect: {
                url: `${baseUrl}/travel/${tripId}/success`,
            },
        },
    });

    return paymentLink;
};
