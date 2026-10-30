// Direct localStorage injection for testing
const subscriptions = [
  {id: 1, name: 'Netflix', amount: 15.99, billingCycle: 'monthly', nextRenewalDate: '2026-09-20', url: 'https://netflix.com'},
  {id: 2, name: 'Spotify', amount: 9.99, billingCycle: 'monthly', nextRenewalDate: '2026-09-22', url: 'https://spotify.com'},
  {id: 3, name: 'Adobe Creative Cloud', amount: 54.99, billingCycle: 'monthly', nextRenewalDate: '2026-10-01', url: 'https://adobe.com'},
  {id: 4, name: 'GitHub Pro', amount: 4.99, billingCycle: 'monthly', nextRenewalDate: '2026-09-25', url: 'https://github.com'},
  {id: 5, name: 'Notion', amount: 8.00, billingCycle: 'monthly', nextRenewalDate: '2026-09-19', url: 'https://notion.so'},
  {id: 6, name: 'Figma', amount: 12.00, billingCycle: 'monthly', nextRenewalDate: '2026-09-21', url: 'https://figma.com'}
];

localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
console.log('Test subscriptions added:', subscriptions.length);
console.log('Subscriptions:', subscriptions);
