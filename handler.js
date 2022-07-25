const fetch = require('node-fetch')
const AWS = require('aws-sdk')
const sns = new AWS.SNS()

module.exports.main = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  if (event.detail.data.attributes.eventType === 'TRANSACTION_CREATED') {
    const transactionResource = await getUpResource(
      event.detail.data.relationships.transaction.links.related,
    )

    if (transactionResource.data.attributes.description === 'Round Up') {
      console.log('Ignored Event: Round Up.')
    } else {
      const accountResource = await getUpResource(
        transactionResource.data.relationships.account.links.related,
      )
      const balance = accountResource.data.attributes.balance.value
      const diff = transactionResource.data.attributes.amount.value
      const prevBalance = balance - diff

      if (balance > 100 && balance % 100 === prevBalance % 100) {
        console.log(
          'Ignored Event: balance > 100 and did not cross 100 threshold.',
        )
      } else {
        const message = `Up (${accountResource.data.attributes.displayName}): ${diff}\nNew balance: ${balance}`
        await sendMessage(message)
        console.log(message)
      }
    }
  } else {
    console.log('Ignored Event:', event.detail.data.attributes.eventType)
  }

  return {
    statusCode: 200,
  }
}

module.exports.debug = async (event) => {
  console.log(JSON.stringify(event, null, 2))
  console.log(JSON.stringify(process.env, null, 2))
  const resource = await getUpResource(
    event.detail.data.relationships.webhook.links.related,
  )
  console.log(JSON.stringify(resource, null, 2))
  const result = await sendMessage('Test message')
  console.log(result)
  return {
    statusCode: 200,
  }
}

const sendMessage = async (message) => {
  const params = {
    Message: message,
    PhoneNumber: process.env.PHONE_NUMBER,
  }
  return sns.publish(params).promise()
}

const getUpResource = async (url) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.UP_TOKEN}`,
    },
  })
  return response.json()
}
