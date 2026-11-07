# CodeStation AWS Deployment

This setup uses one EC2 instance in Sydney (`ap-southeast-2`), Docker Compose, a private S3 bucket for explicit room snapshots, and GitHub Actions over SSH for deploys. The app currently serves temporary HTTP on port `80`.

## Room snapshot storage

Each room gets a server-generated five-character uppercase code. Creating a room reserves its snapshot object, and joining a code that has not been created returns “Room not found.” Each save writes one object at `rooms/<roomId>/snapshot.json`. The snapshot includes the shared file tree and tldraw drawing state. Open editor tabs and the active file are per-user and are not saved.

Treat the short code as a room locator that you share with collaborators, not as strong authentication for private data. Add user authentication or a separate room password before using this for confidential projects.

The S3 bucket stays private. Enable S3 Versioning if you want to recover an earlier snapshot after a later save replaces the same object. Each retained version is a complete snapshot, so storage use grows with saves; [AWS explains S3 Versioning and restore options here](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html). Create the bucket in `ap-southeast-2`, then set `S3_BUCKET_NAME` in the EC2 host's `server/.env`. Set `AWS_REGION=ap-southeast-2` and `S3_ROOM_PREFIX=rooms` there as well.

Attach an EC2 instance role to the instance. Give that role `s3:GetObject` and `s3:PutObject` only on `arn:aws:s3:::YOUR_BUCKET/rooms/*`. Do not put AWS access keys in the image, repository, or `server/.env`; the AWS SDK uses the instance role automatically. See [AWS guidance on EC2 IAM roles](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html).

## EC2 host setup

1. Create an EC2 instance in `ap-southeast-2` and attach an instance role with S3 access as described above.
2. Configure its security group with inbound TCP `80` from the clients who should reach the app. Restrict TCP `22` to your own public IP, as [AWS recommends](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/creating-security-group.html).
3. Install Docker Engine and the Docker Compose plugin on the instance.
4. Add a read-only GitHub deploy key to the repository, then clone the repository to a persistent path such as `/opt/codestation`. The application project is inside the `CodeStation` subfolder.
5. Change into `/opt/codestation/CodeStation`, copy `server/.env.example` to `server/.env`, and fill in the application values, including `S3_BUCKET_NAME`. Keep this file on the host; it is excluded from Docker build context.
6. From `/opt/codestation/CodeStation`, run `docker compose up -d --build` and confirm `http://EC2_PUBLIC_IP/api/health` returns `{"status":"ok"}`.

The Compose file publishes the app on port `80`. Keep the instance role and host `.env` in place when deploying; CI only pulls code and rebuilds the container. Set `S3_BUCKET_NAME` to the bucket name there before starting the production container.

## GitHub Actions deployment

The workflow `.github/workflows/deploy-ec2.yml` is at the repository root. It runs on pushes to `main` and manual dispatch. Add these GitHub Actions repository secrets:

- `EC2_HOST`: the instance public IP or DNS name.
- `EC2_SSH_USER`: the host login user, commonly `ubuntu` or `ec2-user`.
- `EC2_SSH_PRIVATE_KEY`: a deploy-only private SSH key authorized on the host.
- `EC2_HOST_FINGERPRINT`: the EC2 SSH host-key fingerprint, obtained and verified during initial host setup.
- `EC2_APP_PATH`: the cloned repository root, for example `/opt/codestation`. The workflow pulls there, then deploys from its `CodeStation` subfolder.

The EC2 clone must have a read-only repository deploy key configured so `git pull` can fetch a private repository. The workflow does not transfer secrets or the host `.env` file. If your default branch is not `main`, update the workflow trigger and pull command to match it.

## Local Docker run

From the `CodeStation` project directory, copy `server/.env.example` to `server/.env`, fill required values, then run:

```sh
docker compose up --build
```

The API and web app will be available at `http://localhost/`.

## HTTPS later

This first pass uses plain HTTP as requested. Add a domain and TLS termination before collecting sensitive user data or relying on browser features that require a secure context. For a public deployment, set `ALLOWED_ORIGIN` to the deployed origin instead of `*`.
