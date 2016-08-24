import base64
import json

def lambda_handler(event, context):
    print("Received event:"+json.dumps(event))
    for record in event['Records']:
        #Kinesis is base64 encoded.
        #we need to decode the data
        payload = base64.b64decode(record['kinesis']['data'])
        print("Decoded payload: "+payload)
    return 'Successfully process {} records'.format(len(event['Records']))
