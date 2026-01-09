export const logger = async (c: any, next: any) => {
  const method = c.req.method
  const path = c.req.path
  const start = Date.now()

  await next();

  const status = c.res.status
  const executionTime = Date.now() - start;
  const time = new Date().toLocaleTimeString('en-IN')

  console.log(`[${time}] ${method} ${path} ${status} (${executionTime}ms)`)
};


