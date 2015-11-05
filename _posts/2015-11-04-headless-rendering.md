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

<!--In the snippets below, sometimes the shell commands end in semicolons.  This allows you to copy-and-paste a sequence of commands into a terminal.  In the real world, you'd probably want to write bash scripts, or Python scripts that use the <b>boto</b> package.-->

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
export SGROUP=`aws ec2 create-security-group --group-name <span class="madlib">cisec</span> --description "headless"`
aws ec2 authorize-security-group-ingress --group-id $SGROUP --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SGROUP --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SGROUP --protocol tcp --port 8080 --cidr 0.0.0.0/0
</pre>

---

**Creating my very own AMI**

To bootstrap my project, I instantiated an AMI from NVIDIA that I found in the AMI marketplace; it has a September 2015 driver pre-installed, and its image id is in the snippet below.

<pre>
export SGROUP=`aws ec2 describe-security-groups --group-name <span class="madlib">cisec</span> --query 'SecurityGroups[*].[GroupId]'`
export IMAGEID=ami-17985c53 ; # September 2015 NVIDIA package.
export INSTANCEID=`aws ec2 run-instances --image-id $IMAGEID --count 1 \
    --instance-type g2.2xlarge --key-name <span class="madlib">pdawg</span> \
    --security-group-ids $SGROUP --query 'Instances[*].[InstanceId]' `
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[State.Name,PublicDnsName]' \
    --instance-ids $INSTANCEID
</pre>

After creating the instance, I had to wait a minute or two for the machine to become available.  I invoked the above `describe-instances` command a few times to check up on the status.

When the machine became ready, I asked for its DNS name and tried establishing an SSH connection.

<pre>
export DNSNAME=`aws ec2 describe-instances --query 'Reservations[*].Instances[*].[PublicDnsName]' \
    --instance-ids $INSTANCEID`
ssh -i <span class="madlib">personalaws.pem</span> ec2-user@$DNSNAME
</pre>

Next, I wanted to do a bunch of `yum install` stuff so I quit the shell and created a script on my local machine.

<pre>
cat > setup.sh
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
source .bashrc
^D
</pre>

Next I copied my script over to the remote machine, connected to it and ran the script.

<pre>
scp -i <span class="madlib">personalaws.pem</span> setup.sh ec2-user@$DNSNAME:/home/ec2-user/setup.sh
ssh -i <span class="madlib">personalaws.pem</span> ec2-user@$DNSNAME
source setup.sh && rm setup.sh
</pre>

Even for headless OpenGL, I realized I had to run an X server -- I just didn't need a desktop.  Here's how I managed to get the instance to automatically run X.  This probably isn't the best way to do it, but changing the runlevel in `/etc/inittab` didn't seem to work.

<pre>
echo '/usr/bin/X :0 &' | sudo tee -a /etc/rc.d/rc.local
echo 'export DISPLAY=:0' >> .bashrc
sudo reboot
</pre>

After the reboot, I re-connected and ran `glxinfo | grep NVIDIA` to make sure the GPU driver was kosher.  This is what I saw:

<pre>
server glx vendor string: NVIDIA Corporation
client glx vendor string: NVIDIA Corporation
OpenGL vendor string: NVIDIA Corporation
OpenGL version string: 4.4.0 NVIDIA 340.32
OpenGL shading language version string: 4.40 NVIDIA via Cg compiler
</pre>

Woo, the original AMI that I chose had the NVIDIA drivers properly pre-installed!

Next I built GLFW, since that's my favorite GLUT replacement nowadays.

<pre>
curl -L https://github.com/glfw/glfw/archive/3.1.2.tar.gz | tar xz
pushd glfw* && cmake . && sudo make install && popd
rm -rf glfw*
</pre>

At this point, I figured I had a pretty decent development environment.  No more sudo-style commands from this point forward.

So, I cloned the instance to create my very own AMI, then killed off the prototype.

<pre>
^D
export MYAMI=`aws ec2 create-image --instance-id $INSTANCEID --name <span class="madlib">opengldev</span> --query 'ImageId'`
echo $MYAMI
<span class="madlib">...wait for the AMI to crystalize...</span>
aws ec2 terminate-instances --instance-ids $INSTANCEID
</pre>

---

**Building and running my graphics project**

Now that I had a nice pristine template for development, I instantiated a new instance.

<pre>
export SGROUP=`aws ec2 describe-security-groups --group-name <span class="madlib">cisec</span> --query 'SecurityGroups[*].[GroupId]'`
export MYAMI=`aws ec2 describe-images --owners self \
    --filters="Name=name,Values=<span class="madlib">opengldev</span>" --query Images[*].[ImageId]`
export INSTANCEID=`aws ec2 run-instances --image-id $MYAMI --count 1 \
    --instance-type g2.2xlarge --key-name <span class="madlib">pdawg</span> \
    --security-group-ids $SGROUP --query 'Instances[*].[InstanceId]' `
</pre>

After a waiting a minute for the machine to boot, I connected to it.

<pre>
export DNSNAME=`aws ec2 describe-instances --query 'Reservations[*].Instances[*].[PublicDnsName]' \
    --instance-ids $INSTANCEID`
ssh -i <span class="madlib">personalaws.pem</span> ec2-user@$DNSNAME
</pre>

Finally, it was time to clone my personal project, build it, and run the test.

<pre>
git clone https://prideout@github.com/prideout/parg.git && cd parg
cmake -H. -Bbuild -DOPENGL_LIB='' && cmake --build build
./build/trefoil -capture trefoil.png
</pre>

Invoking the test caused X11 to complain about using RandR without a physical monitor.  <span class="madlib">Note to self: make a pull request to GLFW to allow users to disable RandR usage?</span>

Anyway, the X11 spew is harmless as far as I can tell.  Next, I copied over the screenshot and opened the image on my local machine.

<pre>
^D
scp -i <span class="madlib">personalaws.pem</span> ec2-user@$DNSNAME:/home/ec2-user/parg/trefoil.png .
open trefoil.png
</pre>

To my dismay the screenshot was an empty image!  My screenshot grabbing code was straightforward; it issued a **glReadPixels**, then used **stbi_write_png** on the results.

<span style="color:red;font-weight:bold">To fix this, I had to modify my graphics test to render to an FBO instead of the backbuffer.</span>  Maybe because the backbuffer didn't exist?  Interestingly, this seems necessary in an X11 environment but not in a OS X environment.

Anyway, the final step was termination of the instance, to avoid paying Amazon even more than I already do:

<pre>
aws ec2 terminate-instances --instance-ids $INSTANCEID
</pre>

<i>
Philip Rideout
<br>
November 2015
</i>