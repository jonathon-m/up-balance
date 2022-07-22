const fetch = require('node-fetch')
const AWS = require('aws-sdk')
const sns = new AWS.SNS()

module.exports.main = (event, context, callback) => {
  if (event.detail.data.attributes.eventType === 'TRANSACTION_CREATED') {
    getUpResource(
      event.detail.data.relationships.transaction.links.related,
      (transactionResource) => {
        if (transactionResource.data.attributes.description !== 'Round Up') {
          getUpResource(
            transactionResource.data.relationships.account.links.related,
            (accountResource) => {
              const message = `Up (${accountResource.data.attributes.displayName}): ${transactionResource.data.attributes.amount.value}\nNew balance: ${accountResource.data.attributes.balance.value}`
              sendMessage(message, (err, data) => {
                callback(null, {
                  statusCode: 200,
                })
              })
            },
          )
        } else {
          callback(null, {
            statusCode: 200,
          })
        }
      },
    )
  } else {
    callback(null, {
      statusCode: 200,
    })
  }
}

module.exports.debug = (event, context, callback) => {
  console.log(JSON.stringify(event, null, 2))
  console.log(JSON.stringify(process.env, null, 2))
  getUpResource(
    event.detail.data.relationships.webhook.links.related,
    (resource) => {
      console.log(JSON.stringify(resource, null, 2))
      sendMessage('Test message', (err, data) => {
        console.log(err)
        console.log(data)
        callback(null, {
          statusCode: 200,
        })
      })
    },
  )
}

const sendMessage = (message, callback) => {
  const params = {
    Message: message,
    TopicArn: process.env.SNS_TOPIC,
  }
  sns.publish(params, callback)
}

const getUpResource = (url, callback) => {
  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.UP_TOKEN}`,
    },
  }).then((response) => {
    response.json().then(callback)
  })
}
