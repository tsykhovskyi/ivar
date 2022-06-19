import { Debugger } from "./debugger/debugger";
import { runHttp } from "./http/server";

// (async () => {
//   const debug = new Debugger();
//   await debug.init();
//
//   let response;
//   response = await debug.whole();
//
//   const res = await Promise.allSettled([
//     debug.step(),
//     debug.addBreakpoint(14),
//     debug.print(),
//   ])
//
//   // response = await debug.step();
//   // response = await debug.addBreakpoint(14);
//   // response = await debug.print();
//
//
//   return 0;
// })().catch(e => {
//   console.error(e)
// })


runHttp();
