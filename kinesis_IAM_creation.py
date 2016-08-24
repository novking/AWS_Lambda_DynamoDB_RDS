import time
import json
import boto3

kinesis = boto3.client('kinesis')
iam = boto3.client('iam')
l = boto3.client('lambda')

def create_stream(name):
    if name not in [f for f in kinesis.list_streams()['StreamNames']]:
        print 'Creating Kinesis stream %s'%(name)
        kinesis.create_stream(StreamName=name, ShardCount=1)
    else:
        print "Kinesis stream %s exists" % (name)
    
    while kinesis.describe_stream(StreamName=name)['StreamDescription']['StreamStatus']=='CREATING':
        time.sleep(2)
    return kinesis.describe_stream(StreamName=name)['StreamDescription']



def create_role(name, policies=None): #policies here is actually the policies's ARN
    '''this function is to create a role that can allow Lambda have some access'''
    policydoc ={
        "Version":"2012-10-17",
        "Statement":[
            {
                "Effect":"Allow",
                "Principal":{
                    "Service":["lambda.amazonaws.com"]
                },
                "Action":["sts:AssumeRole"]
            },
        ]
    }
    
    roles = [r['RoleName'] for r in iam.list_roles()['Roles']]
    if name in roles:
        print 'IAM role %s exists'%(name)
        role = iam.get_role(RoleName = name)['Role']
    else:
        print 'Creating IAM role %s' %(name)
        role = iam.create_role(RoleName=name, AssumeRolePolicyDocument=json.dumps(policydoc))['Role']
    
    if policies is not None:
        for p in policies:
            iam.attach_role_policy(RoleName=role['RoleName'], PolicyArn = p)
    return role

def create_function(name, zfile, lsize=512, timeout=10, update=False):
    '''this is for creating or updating lambda function'''
    role = create_role(name+'_lambda', policies=['arn:aws:iam::aws:policy/service-role/AWSLambdaKinesisExecutionRole'])  #note that i attached Kinesis Role in order to run kinesis in lambda
    with open(zfile, 'rb') as zipfile:
        if name in [f['FunctionName'] for f in l.list_functions()['Functions']]:
            if update:
                print 'Updating %s lambda function code' % (name)
                return l.update_function_code(FunctionName=name, ZipFile=zipfile.read())
            else:
                print 'Lambda function %s exists' % (name)
                # do something
        else:
            print 'Creating {} lambda function'.format((name))
            lfunc = l.create_fucntion(
                FunctionName=name,
                Runtime='python2.7',
                Role=role['Arn'],#????hmm im not sure
                Handler='lambda.lambda_handler',
                Description='Example lambda function to ingest a Kinesis stream',
                Timeout=timeout,
                MemorySize=lsize,
                Publish=True,
                Code = {'ZipFile': zipfile.read()}
            )
        lfunc['Role']=role
        return lfunc
    
def create_mapping(name, stream):
    '''map to stream'''
    sources= l.list_event_source_mappings(FunctionName=name, EventSourceArn=stream['StreamARN'])['EventSourceMappings']
    if stream['StreamARN'] not in [s['EventSourceArn'] for s in sources]:
        source = l.create_event_source_mapping(FunctionName=name, EventSourceArn=stream['StreamARN'],StartingPosition='TRIM_HORIZON')
    else:
        for s in sources:
            source = s
    return source

if __name__=='__main__':
    name= 'aaron'
    
    #create stream
    stream = create_stream(name)
    
    #create lambda function
    lfunc = create_function(name, 'lambda.zip', update=True)
    
    #mapping
    create_mapping(name, stream)
                
        
    
#    reference:
#    https://developmentseed.org/blog/2016/03/08/aws-lambda-functions/
            
    