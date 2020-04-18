import axios from 'axios'
import isFunction from 'lodash/isFunction';
import isEmpty from 'lodash/isEmpty';

import { API_URL, TIMEOUT } from './config';

axios.defaults.baseURL = API_URL;
axios.defaults.timeout = TIMEOUT;
axios.defaults.withCredentials = true;

const errorDefault = {
  status: null,
  url: null,
  message: null
}

const parseDataError = (url, status, errors?) => {
  const obj = { url, status: status == null ? 200 : status } as any;
  const fieldErrors = {}

  Array.isArray(errors) && errors.forEach(error => {
    if (error[ 'id' ] == null) {
      obj.message = error[ 'message' ]
    } else {
      fieldErrors[ error[ 'id' ] ] = error[ 'message' ]
    }
  })

  if (!isEmpty(fieldErrors)) {
    obj.fieldErrors = fieldErrors
  }

  return obj
}

const isBlobResponse = (params) => params && params.responseType === 'blob';

const parseFinishData = (params, blobEnabled, response, data) => {
  if (blobEnabled) { // Handle file download
    const suggestedFileName = response.headers[ 'x-suggested-filename' ]
    const fileName = suggestedFileName == null ? params.defaultFileName : suggestedFileName
    return {
      fileName,
      data: response.data
    }
  } else {
    return data
  }
}

const callFinish = (onFinish, success, result) => {
  isFunction(onFinish) && onFinish(success, result)
}

const parseBlobError = (url, status, data, message) => {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.addEventListener('loadend', event => {
      let obj = null
      try {
        const { result } = event.srcElement as any
        const data = JSON.parse(result)
        const { status, errors } = data
        obj = parseDataError(url, status, errors)
        if (!obj.message) {
          obj.message = message
        }
      } catch (ex) {
        console.error(ex)
        obj = parseDataError(url, status)
        obj.message = message
      } finally {
        resolve(obj)
      }
    })
    reader.readAsText(data)
  })
}

const parseRequestError = (url, error) => {
  let obj = { url, status: 0, message: '' }

  if (error[ 'response' ]) {
    obj.status = error[ 'response' ][ 'status' ]

    switch (obj.status) {
      case 400:
        const { data } = error[ 'response' ]
        if (data instanceof Blob) {
          return parseBlobError(url, obj.status, data, 'Bad request')
        } else {
          const { status, errors } = data
          obj = parseDataError(url, status, errors)
          if (!obj.message) {
            obj.message = 'Bad request'
          }
        }
        break
      case 401:
        obj.message = 'Your session has expired. Please login to renew your session.'
        break
      case 403:
        obj.message = 'You don\'t have permission to access this server'
        break
      case 404:
        obj.message = 'Request is not found'
        break
      case 407:
        obj.message = 'Proxy authentication is required'
        break
      case 500:
        obj.message = 'Internal server error'
        break
      case 503:
        obj.message = 'Service is unavailable'
        break
      case 200:
        obj.message = 'Invalid JSON response' // Reponse must be in JSON format
        break
      case 0:
        obj.message = 'Network seems unreachable' // Disconnected or rejected cross-domain AJAX request
        break
      default:
        obj.message = 'Unexpected error'
    }
  } else if (error[ 'request' ]) {
    obj.message = 'Request is timed out due to bad or slow network connection'
  } else if (error[ 'message' ]) {
    obj.message = error[ 'message' ]
  } else {
    obj.message = 'Unknown error'
  }

  return new Promise(resolve => {
    resolve(obj)
  })
}

const handleResponse = ({
  url,
  params,
  onSuccess,
  onFinish,
  response
}) => {
  const { data: { status, data, errors } } = response

  // if (Array.isArray(errors)) {
  //   const error = parseDataError(url, status, errors)
  //   commit(mutationTypes.base, { type: mutationTypes.ERROR, error })
  //   callFinish(onFinish, false, error)
  // } else {
  //   const blobEnabled = isBlobResponse(params)
  //   const result = parseFinishData(params, blobEnabled, response, data)

  //   if (isFunction(onDataReceived)) {
  //     if (onDataReceived(data) === false) {
  //       commit(mutationTypes.base, { type: mutationTypes.SUCCESS })
  //     } else {
  //       !blobEnabled && onSuccess && onSuccess(result)
  //       commit(mutationTypes.base, { type: mutationTypes.SUCCESS, data })
  //     }
  //   } else {
  //     !blobEnabled && onSuccess && onSuccess(result)
  //     commit(mutationTypes.base, { type: mutationTypes.SUCCESS, data })
  //   }
  //   callFinish(onFinish, true, result)
  // }
}

const handleError = ({
  url,
  onFinish,
  error
}) => {
  if (axios.isCancel(error)) {
    console.log(`Request is canceled (${ url })`)
  } else {
    parseRequestError(url, error).then(error => {
      callFinish(onFinish, false, error)
    })
  }
}

const sendRequest = (request, { url, params, onSuccess, onFinish }) => {
  return request
    .then(
      response => handleResponse({ url, params, onSuccess, onFinish, response }),
      reject => handleError({ url, onFinish, error: reject })
    )
    .catch(thrown => handleError({ url, onFinish, error: thrown }))
}

export const httpGet = (url, { params = {}, onSuccess, onFinish }) => {
  return sendRequest(axios.get(url, params), { url, params, onSuccess, onFinish });
}

export const httpPost = (url, {
  data = null,
  params = {},
  onSuccess,
  onFinish
}) => sendRequest(axios.post(url, data, params), {
  url,
  params,
  onSuccess,
  onFinish
})

export const httpPut = ({
  url,
  data = null,
  params = null,
  onSuccess,
  onFinish
}) => sendRequest(axios.put(url, data, params), {
  url,
  params,
  onSuccess,
  onFinish
})

export const httpDelete = ({
  url,
  data = null,
  params = null,
  onSuccess,
  onFinish
}) => sendRequest(axios.delete(url, data), {
  url,
  params,
  onSuccess,
  onFinish
})