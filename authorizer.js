
module.exports.main = (event, context, callback) => {
    const received_signature = event.headers['x-up-authenticity-signature']
    callback(null, {
        isAuthorized: !!received_signature,
    });
}