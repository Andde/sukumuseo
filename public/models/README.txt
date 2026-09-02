Face-api.js model weights go in this folder.

The admin face-tagger loads three models: tinyFaceDetector (detection),
faceLandmark68Net (facial landmarks), and faceRecognitionNet (128-d
embeddings for FaceMatcher).

Download the following files from the face-api.js repo and drop them here.
Repo: https://github.com/justadudewhohacks/face-api.js
Path in repo: weights/

Files needed (exact filenames):

  tiny_face_detector_model-weights_manifest.json
  tiny_face_detector_model-shard1

  face_landmark_68_model-weights_manifest.json
  face_landmark_68_model-shard1

  face_recognition_model-weights_manifest.json
  face_recognition_model-shard1
  face_recognition_model-shard2

Once these are in public/models/, the "Tunnista kasvot" button on
/admin/photos/<id> will start detecting faces and (once you've tagged a
few people) suggesting matches from stored embeddings.

The rest of the site does not load face-api.js, so users who never open
the admin panel don't pay the ~5 MB model download.
