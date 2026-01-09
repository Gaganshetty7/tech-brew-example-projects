export const responseFormatter = async (c: any, next: any) => {

    await next();

    let body: any
    try {
        body = await c.res.clone().json();
    } catch {
        return;
    }

    const status = c.res.status;
    const isSuccess = status >= 200 && status < 400

    const formatted = {
        success: isSuccess,
        // first isSuccess ? ... : null
        //second if isSuccess = True, body?.data
        //third if body?.data exists then data is body.data else its null (after ??)
        data: isSuccess ? body?.data ?? null : null,
        //first body?.message
        //if exists then message is body.message else if no body or message then ternary operator inside () is checked
        message: body?.message ?? (isSuccess ? 'OK' : 'Request Failed')
    }

    c.res = c.json(formatted, status);
    return;

}