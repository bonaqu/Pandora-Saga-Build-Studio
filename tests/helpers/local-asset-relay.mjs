// Shared local static-asset forwarding for public-origin Chromium smokes.
// A browser may tear down an image request while the parallel test server is
// shutting down. Abort that particular request, never let an unhandled
// route.fetch rejection kill the entire runner. Navigation/network failures
// remain visible as failed browser requests and fail their own assertions.
const transientTransport=/ECONNRESET|ECONNREFUSED|ERR_CONNECTION_(?:RESET|REFUSED)|Target page, context or browser has been closed|Request aborted|route.*(?:handled|closed)/i;
export async function relayLocalAsset(route,url){
 try{
  const response=await route.fetch({url});
  await route.fulfill({response});
 }catch(error){
  if(!transientTransport.test(String(error?.message||error)))throw error;
  // The route can already be closed or handled by the time the socket fails.
  // In that case abort itself rejects; the browser has already cancelled.
  try{await route.abort('failed')}catch{}
 }
}
