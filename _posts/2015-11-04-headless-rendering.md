---
layout: page
tags : [opengl]
description : "Diary of adventures with headless OpenGL on an EC2 server."
thumbnail : Headless-masked.png
---
{% include JB/setup %}

### Headless OpenGL with Amazon Web Services and NVIDIA

I recently had the idea of using the cloud for continuous integration of a graphics engine.  This gave me an excuse to play with a GRID machine at Amazon.

Please note that I am by no means a backend engineer, and that I'm a total caveman when it comes to AWS.  This article is just a diary, in case my future self needs it, or any like-minded cavemen and cavewomen.

In my notes, anything in <span class="madlib">blue italics</span> is a placeholder and can be replaced with whatever string happens to be appropriate in your case.

In the snippets below, sometimes the shell commands end in semicolons.  This allows you to copy-and-paste a sequence of commands into a terminal.  In the real world, you'd probably want to write bash scripts, or Python scripts that use the <b>boto</b> package.

TBD: include a TOC here

---

**Configuring AWS and setting up security stuff**

The first thing I did is install the AWS command line interface and configure it with the proper security info.

During the configure step, I chose <b>text</b> for the default output format to make it easy to stash the results of commands into variables.

<pre>
pip install awscli
aws configure
</pre>

I also had to create a key pair and pem file, used only for establishing a SSH connection.

<pre>
aws ec2 create-key-pair --key-name <span class="madlib">pdawg</span> --query 'KeyMaterial' > <span class="madlib">personalaws.pem</span>
chmod 400 <span class="madlib">personalaws.pem</span>
</pre>

And...a security group.

<pre>
export SGROUP=`aws ec2 create-security-group --group-name <span class="madlib">cisec</span> --description "headless"` ;
aws ec2 authorize-security-group-ingress --group-id $SGROUP --protocol tcp --port 22 --cidr 0.0.0.0/0 ;
aws ec2 authorize-security-group-ingress --group-id $SGROUP --protocol tcp --port 80 --cidr 0.0.0.0/0 ;
aws ec2 authorize-security-group-ingress --group-id $SGROUP --protocol tcp --port 8080 --cidr 0.0.0.0/0
</pre>

---

**Setting up the instance**

I accidentally closed my terminal so recovered the security group id like this:

<pre>
export SGROUP=`aws ec2 describe-security-groups --group-name <span class="madlib">cisec</span> --query 'SecurityGroups[*].[GroupId]'`
</pre>

Next, I instantiated the actual Amazon Linux AMI.  I found one from NVIDIA that has a September 2015 driver pre-installed; its image id is in the snippet below.

<pre>
export IMAGEID=ami-17985c53 ; # September 2015 NVIDIA package. ;
export INSTANCEID=`aws ec2 run-instances --image-id $IMAGEID --count 1 \
    --instance-type g2.2xlarge --key-name <span class="madlib">pdawg</span> \
    --security-group-ids $SGROUP --query 'Instances[*].[InstanceId]' `;
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[State.Name,PublicDnsName]' \
    --instance-ids $INSTANCEID
</pre>

The last command in the above snippet can be used at any time to check up on the status of your new instance.

Now, wait a minute for instance to become ready to accept ssh connections, then query its DNS name and ssh into it, like this:

<pre>
export DNSNAME=`aws ec2 describe-instances --query 'Reservations[*].Instances[*].[PublicDnsName]' \
    --instance-ids $INSTANCEID` ;
ssh -i <span class="madlib">personalaws.pem</span> ec2-user@$DNSNAME
</pre>

Did it work?  Good.  Now, quit ssh and create a setup script:

<pre>
######################################
echo Installing and configuring git...
sudo yum install git -y
git config --global user.name "<span class="madlib">Philip Rideout</span>"
git config --global user.email "<span class="madlib">philiprideout@gmail.com</span>"
git config --global push.default simple

##############################################
echo Installing and configuring developer tools...
sudo yum install gcc-c++ libX*-devel mesa-libGL-devel curl-devel -y
sudo yum install emacs glx-utils cmake -y
echo 'export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig' >> .bashrc
. .bashrc
</pre>

Next re-connect to the machine and run the script:

<pre>
^D
scp -i <span class="madlib">personalaws.pem</span> setup.sh ec2-user@$DNSNAME:/home/ec2-user/setup.sh;
ssh -i <span class="madlib">personalaws.pem</span> ec2-user@$DNSNAME;
. setup.sh
</pre>

Even for headless OpenGL, we still need to run an X server; we just won't interact with it or look at a desktop.  Let's go ahead and spawn X, then quit the SSH session to avoid X spewage in the console.

<pre>
echo 'export DISPLAY=:0' >> .bashrc ; . .bashrc ; sudo /usr/bin/X $DISPLAY &
^D
</pre>

Now, start a new SSH session and ensure that the output of `glxinfo` looks reasonable.  "NVIDIA" should appear several times in the output.

<pre>
ssh -i personalaws.pem ec2-user@$DNSNAME ;
glxinfo | grep NVIDIA
</pre>

### Building GLFW and my little project

First, GLFW:

<pre>
git clone https://github.com/prideout/glfw.git && cd glfw;
cmake . && sudo make install && cd ..
</pre>

Now, build your project and generate a screenshot:

<pre>
git clone https://prideout@github.com/prideout/parg.git && cd parg ;
cmake -H. -Bbuild -DOPENGL_LIB='' && cmake --build build ;
./build/picking -capture picking.png
^D
</pre>

Now, copy over the screenshots and enjoy:

<pre>
scp -i personalaws.pem ec2-user@$DNSNAME:/home/ec2-user/parg/picking.png .
open picking.png
</pre>

Uhhh, wait why were the screenshots blank?  It turned out that I had to modify my code to render to an FBO, instead of straight to the backbuffer.  Maybe because the backbuffer didn't exist?  Interestingly, it was necessary in an XWindows environment but not in a OS X environment.

Finally, I was sure to terminate the instance, to avoid paying Amazon even more than I already do:

<pre>
aws ec2 terminate-instances --instance-ids $INSTANCEID
</pre>

<i>
Philip Rideout
<br>
November 2015
</i>