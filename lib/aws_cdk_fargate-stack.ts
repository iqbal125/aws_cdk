import * as cdk from "@aws-cdk/core"
import * as ec2 from "@aws-cdk/aws-ec2"
import * as ecs from "@aws-cdk/aws-ecs"
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns"

export class AwsCdkFargateStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // The code that defines your stack goes here
    const vpc = new ec2.Vpc(this, "VPC")

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
    })

    // Add capacity to it
    cluster.addCapacity("DefaultAutoScalingGroupCapacity", {
      instanceType: new ec2.InstanceType("t2.micro"),
      desiredCapacity: 1,
    })

    const taskDefinition = new ecs.FargateTaskDefinition(this, "TaskDef")

    taskDefinition.addContainer("DefaultContainer", {
      image: ecs.ContainerImage.fromAsset("./local-image"),
      memoryLimitMiB: 512,
    })

    // Instantiate an Amazon ECS Service
    const ecsService = new ecs.FargateService(this, "Service", {
      cluster,
      taskDefinition,
      assignPublicIp: true,
    })
  }
}
