import * as cdk from "@aws-cdk/core"
import * as ec2 from "@aws-cdk/aws-ec2"
import * as ecs from "@aws-cdk/aws-ecs"
import * as rds from "@aws-cdk/aws-rds"

require("dotenv").config()

export class AwsCdkFargateStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // The code that defines your stack goes here
    const vpc = new ec2.Vpc(this, "VPC")

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
    })

    const db_name = process.env.DB_NAME
    const db_password = process.env.DB_PASSWORD
    const db_username = process.env.DB_USERNAME

    const instance = new rds.DatabaseInstance(this, "Instance", {
      engine: rds.DatabaseInstanceEngine.postgres({version: rds.PostgresEngineVersion.VER_10}),
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromUsername(db_username, {password: db_password}),
      databaseName: db_name,
    })

    //instance.connections.

    // Add capacity to it
    cluster.addCapacity("DefaultAutoScalingGroupCapacity", {
      instanceType: new ec2.InstanceType("t2.micro"),
      desiredCapacity: 1,
    })

    const taskDefinition = new ecs.FargateTaskDefinition(this, "TaskDef")

    const logging = new ecs.AwsLogDriver({
      streamPrefix: "myapp",
    })

    taskDefinition.addContainer("DefaultContainer", {
      image: ecs.ContainerImage.fromAsset("./local-image"),
      memoryLimitMiB: 512,
      logging,
    })

    const securityGroup = new ec2.SecurityGroup(this, `security-group`, {
      vpc,
    })

    securityGroup.addIngressRule(ec2.Peer.ipv4("0.0.0.0/0"), ec2.Port.tcp(80))

    // Instantiate an Amazon ECS Service
    const ecsService = new ecs.FargateService(this, "Service", {
      cluster,
      taskDefinition,
      assignPublicIp: true,
      securityGroups: [securityGroup],
    })
  }
}
