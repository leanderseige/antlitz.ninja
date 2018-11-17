#!/usr/bin/env python3
# coding: utf-8

# # ANLITZ.
#
# ### Step 1: Import some libraries.

# In[1]:


import numpy as np
import urllib.request
import cv2
import json
from random import randint
import csv


murl = "https://iiif.manducus.net/collections/0009/collection.json"

mresp = urllib.request.urlopen(murl)
mdata = mresp.read().decode("utf-8")
mdata = json.loads(mdata)

pid = 0
img_urls = {}
mfs_urls = {}
cnv_urls = {}
for m in mdata['manifests']:
    url = m['@id']
    resp = urllib.request.urlopen(url)
    data = resp.read().decode("utf-8")
    data = json.loads(data)
    for c in data['sequences'][0]['canvases']:
        img_urls[pid]=c['images'][0]['resource']['service']['@id']
        mfs_urls[pid]=url
        cnv_urls[pid]=c['@id']
        print (mfs_urls[pid]+" => "+img_urls[pid])
        pid = pid +1
    # if pid > 10000:
        # break

print ("Ready.")



def url_to_image(url):
    resp = urllib.request.urlopen(url)
    image = np.asarray(bytearray(resp.read()), dtype="uint8")
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    return image


# # Step 5: Read all images with 10% of their actual size.

# ### Step 6: Get us a function to detect faces using the opencv lib.

# In[5]:


img_smalls = {}
for pid in img_urls:
    print("loading 10pct %s" % img_urls[pid])
    turl = img_urls[pid]+"/full/pct:10,/0/native.jpg"
    img_smalls[pid] = url_to_image(turl)
    if pid == 1000:
        break


# In[6]:


def analyze_images(image):
    faceCascade = cv2.CascadeClassifier("haarcascades/haarcascade_frontalface_alt.xml")
    faces = faceCascade.detectMultiScale(
        image,
        scaleFactor=1.1,
        minNeighbors=8,
        minSize=(60, 60),
        flags = cv2.CASCADE_SCALE_IMAGE
    )
    return faces


faces_xy = {}
fid = 0
for pid in img_smalls:
    print("searching %s" % img_urls[pid])
    faces = analyze_images(img_smalls[pid])
    for (x, y, w, h) in faces:
        faces_xy[fid] = {}
        faces_xy[fid]['pid'] = pid
        faces_xy[fid]['x'] = x*10
        faces_xy[fid]['y'] = y*10
        faces_xy[fid]['w'] = w*10
        faces_xy[fid]['h'] = h*10
        fid = fid +1

print ("Found {0} faces!".format(len(faces_xy)))


# ### Step 8: Generate URLs to the facial regions for each recognized face.

# In[8]:


for fid in faces_xy:
    pid = faces_xy[fid]['pid']
    x = faces_xy[fid]['x']
    y = faces_xy[fid]['y']
    w = faces_xy[fid]['w']
    h = faces_xy[fid]['h']
    url = img_urls[pid]+"/%d,%d,%d,%d/300,/0/native.jpg"%(x,y,w,h)
    faces_xy[fid]['quick_url'] = url


template = '''
{
  "@context":"http://iiif.io/api/presentation/2/context.json",
  "@id":"https://iiif.manducus.net/annotations/antlitzninja_faces_met.json",
  "@type":"sc:AnnotationList",
  "resources": []
}
'''
j = json.loads(template)
for fid in faces_xy:
    pid = faces_xy[fid]['pid']
    x = faces_xy[fid]['x']
    y = faces_xy[fid]['y']
    w = faces_xy[fid]['w']
    h = faces_xy[fid]['h']
    tj={}
    tj["@type"] = "oa:Annotation"
    tj["motivation"] = "sc:painting"
    tj["resource"] = {}
    tj["resource"]["@type"] = "cnt:ContentAsText"
    tj["resource"]["chars"] = "antlitz face detected"
    tj["on"] = {}
    tj["on"]["@id"] = "%s#xywh=%d,%d,%d,%d" % (cnv_urls[pid],x,y,w,h)
    tj["on"]["within"] = {}
    tj["on"]["within"]["@id"] = mfs_urls[pid]
    tj["on"]["within"]["type"] = "sc:Manifest",
    tj["on"]["within"]["label"] = "Example Manifest"
    j['resources'].append(tj)
with open("antlitz_faces_met.json", 'w') as outfile:
    json.dump(j, outfile, indent=2)


# In[ ]:
