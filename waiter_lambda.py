from __future__ import print_function
import json
import boto3
import time
import urllib
print ('Loading function')

s3 = boto3.client('s3')

def lambda_handle(event, context):
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.unquote_plus(event['Records'][0]['s3']['object']['key'])
    try:
        print("Using waiter to waiting for oject to persist on s3")
        #waiter can suspend lambda runtime until object is completely uploaded to s3. 
        #Document: 
        '''Waiters use a client's service operations to poll the status of an AWS resource and suspend execution until the AWS resource reaches the state that the waiter is polling for or a failure occurs while polling.'''
        #http://boto3.readthedocs.io/en/latest/guide/clients.html
        
        waiter = s3.get_waiter('object_exists')
        # Retrieve waiter instance that will wait till a specified S3 bucket exists
        
        
        '''Then to actually start waiting, you must call the waiter's wait() method with the method's appropriate parameters passed in:'''
        waiter.wait(Bucket = bucket, Key = key)
        
        response = s3.head_object(Bucket=bucket, Key=key)
        
        #some output
        print("CONTENT TYPE: " + response['ContentType'])
        print("ETag: " + response['ETag'])
        print("Content-Length: ", response['ContentLength'])
        print("Keyname: " + key)
        print("Deleting object…" + key)
        
        #start to delete the object
        s3.delete_object(Bucket=bucket, Key=key)
        return response['ContentType']
    except Exception as e:
        print(e)
        print('Error getting object {} from bucket {}. Make sure they exist and your bucket is in the same region as this lambda function'.format(key, bucket))
        raise e
        
        
        
        
#IAM
'''
{
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::*"
            ]
}
'''

#s3 structure
"""
{  
   "Records":[  
      {  
         "eventVersion":"2.0",
         "eventSource":"aws:s3",
         "awsRegion":"us-east-1",
         "eventTime":The time, in ISO-8601 format, for example, 1970-01-01T00:00:00.000Z, when S3 finished processing the request,
         "eventName":"event-type",
         "userIdentity":{  
            "principalId":"Amazon-customer-ID-of-the-user-who-caused-the-event"
         },
         "requestParameters":{  
            "sourceIPAddress":"ip-address-where-request-came-from"
         },
         "responseElements":{  
            "x-amz-request-id":"Amazon S3 generated request ID",
            "x-amz-id-2":"Amazon S3 host that processed the request"
         },
         "s3":{  
            "s3SchemaVersion":"1.0",
            "configurationId":"ID found in the bucket notification configuration",
            "bucket":{  
               "name":"bucket-name",
               "ownerIdentity":{  
                  "principalId":"Amazon-customer-ID-of-the-bucket-owner"
               },
               "arn":"bucket-ARN"
            },
            "object":{  
               "key":"object-key",
               "size":object-size,
               "eTag":"object eTag",
               "versionId":"object version if bucket is versioning-enabled, otherwise null",
               "sequencer": "a string representation of a hexadecimal value used to determine event sequence, 
                   only used with PUTs and DELETEs"            
            }
         }
      },
      {
          // Additional events
      }
   ]
}  
"""