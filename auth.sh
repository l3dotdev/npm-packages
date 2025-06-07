PROFILE=( $(cat .aws_profile) )
aws codeartifact --region eu-central-1 --profile $PROFILE login --tool npm --repository l3dev --domain packages --namespace @l3dev