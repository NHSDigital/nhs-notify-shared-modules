export const region: () => string = () => process.env.AWS_REGION || 'eu-west-2';
