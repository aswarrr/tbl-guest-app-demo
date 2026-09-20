import { test, expect } from '@playwright/test';
const token='a'.repeat(43);
const fixture=(status='AWAITING_PAYMENT',resolution: string|null=null)=>({restaurant:{name:'Juniper House',logoUrl:null,accent:'#263d32'},branch:{name:'Downtown',address:'12 Garden Street',timezone:'Africa/Cairo'},reservation:{reference:'TBL-123',startsAt:'2026-12-20T18:00:00Z',partySize:4},amountMinor:50000,currency:'EGP',type:'DEPOSIT',reason:'Reservation deposit',expiresAt:new Date(Date.now()+3600000).toISOString(),serverTime:new Date().toISOString(),status,resolution,unavailable:false,requiresConfirmation:true});
test('anonymous mobile payment page shows reservation and hands off to hosted checkout',async({page})=>{
 const errors: string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});
 await page.route('**/api/public/payment-requests/**',async route=>{const checkout=route.request().url().endsWith('/checkout');expect(route.request().headers().authorization).toBeUndefined();expect(route.request().headers().referer).toBeUndefined();await route.fulfill({json:{ok:true,data:checkout?{checkoutUrl:'https://checkout.stripe.com/c/pay/test_request'}:fixture()}});});
 await page.route('https://checkout.stripe.com/**',route=>route.fulfill({contentType:'text/html',body:'<h1>Hosted checkout handoff</h1>'}));
 await page.goto('/pay/'+token+'?success=true');await expect(page.getByRole('heading',{name:'Reservation deposit'})).toBeVisible();
 await expect(page.getByText('4 guests',{exact:true})).toBeVisible();await expect(page.getByText('Juniper House',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/payment-request-mobile.png',fullPage:true});
 await page.getByRole('button',{name:/Pay.*500/}).click();await expect(page.getByRole('heading',{name:'Hosted checkout handoff'})).toBeVisible();expect(errors).toEqual([]);
});
for(const [status,resolution,title] of [['PAID','APPLIED','Payment received'],['PAID','NEEDS_REFUND','Payment received · review needed'],['EXPIRED',null,'This payment link has expired'],['CANCELED',null,'This request is no longer active']] as const){
 test('renders '+status+' '+resolution,async({page})=>{await page.route('**/api/public/payment-requests/**',route=>route.fulfill({json:{ok:true,data:fixture(status,resolution)}}));await page.goto('/pay/'+token);await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();await expect(page.getByRole('button',{name:/^Pay /})).toHaveCount(0);});
}
test('server-adjusted countdown expires and disables payment',async({page})=>{
 const data=fixture();data.serverTime=new Date(Date.now()+3600000).toISOString();data.expiresAt=new Date(Date.now()+3601200).toISOString();
 await page.route('**/api/public/payment-requests/**',route=>route.fulfill({json:{ok:true,data}}));await page.goto('/pay/'+token);await expect(page.getByRole('heading',{name:'This payment link has expired'})).toBeVisible({timeout:5000});await expect(page.getByRole('button',{name:/^Pay /})).toHaveCount(0);
});
