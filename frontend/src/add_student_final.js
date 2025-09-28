document.addEventListener('DOMContentLoaded',() => {
  // Authentication Guard
  const token = localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  feather.replace();

  const content_model_unloaded=document.getElementById('loading-overlay');
  const content_model_loaded = document.getElementById('main-content');

  let detector=null;
  let is_model_loaded = false;

  const loadModel = async () => {
    try{
      await tf.setBackend('wasm');
      await tf.ready();
      console.log('wasm backend has been set successfully');
    }catch (e){
      console.log('setting wasm backend failed in loadModel() with error:',e);
    }

    try{
      const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
      const detectorConfig ={
        runtime: 'tfjs',
        maxFaces: 1,
        minDetectionConfidence: 0.5
      };
      detector = await faceDetection.createDetector(model, detectorConfig);
      is_model_loaded = true;
    }catch (e){
      console.log('loading model failed in loadModel() with error:',e);
    }
  };

  loadModel().then(() => {
    if(is_model_loaded){
      console.log('model has loaded succesfully');
      content_model_unloaded.classList.add('d-none');
      content_model_loaded.classList.remove('d-none');
    }
  });



  const controls = document.querySelector('.controls');
  const cameraOptions = document.querySelector('.video-options>select');
  const video = document.querySelector('video');
  const buttons = [...controls.querySelectorAll('button')];
  // video processing elements
  const drawFaceFrames = document.getElementsByClassName('video-frames')[0];
  const processFrames = document.getElementsByClassName('mark-face-frames')[0];
  const videoProcessing = document.getElementsByClassName('video-processing')[0];
  //registration input final prview
  const registerStudent = document.getElementsByClassName('register-input')[0];
  const registerImagePreview = document.querySelector('.register-input>img');
  const registerStudentName = document.getElementById('student-name');
  const registerStudentRollNo = document.getElementById('roll-no');

  const [play, videoOff] = buttons;
  //play is for starting the camera stream
  //videoOff is for stopping the camera stream


  // setting student-form-details for final preview
  const studentName = sessionStorage.getItem('newStudentName');
  const studentRollNo = sessionStorage.getItem('newStudentRollNo');
  if(studentName === null || studentRollNo === null){
    alert('Student details not found. Please enter student details first.');
    window.location.href = 'add_student_details.html';
  }
  registerStudentName.value = studentName;
  registerStudentRollNo.value = studentRollNo;
  //

  const studentDetails = JSON.stringify({
    name: studentName,
    roll_no: studentRollNo
  });

  let processingActive = false;
  let streamStarted = false;
  let cameraChanged = false;

  const constraints = {
    video: {
      width: {
        ideal: 1280
      },
      height: {
        ideal: 720
      }
    }
  };

  const getCameraSelection = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => (device.kind === 'videoinput'));
    if(videoDevices.length === 0){
      console.log('No cameras found');
    }
    const options = videoDevices.map(videoDevice => {
      return `<option value="${videoDevice.deviceId}">${videoDevice.label}</option>`;
    });
    cameraOptions.innerHTML = options.join('');
  };

  play.onclick = async () => {
    if (streamStarted && !cameraChanged) {
      
      play.classList.add('d-none');
    }
    else if (('mediaDevices' in navigator && navigator.mediaDevices.getUserMedia)) {
      const updatedConstraints = {
        ...constraints,
        deviceId: {
          exact: cameraOptions.value
        }
      };
      cameraChanged = false;
      startStream(updatedConstraints).then(stream => {
        handleStream(stream);
        
        drawFaceFrames.classList.remove('d-none');
        processFrames.classList.remove('d-none');
        console.log("camera stream has started on: ",cameraOptions.value);
      });
    }
    else{
      console.log('something is wrong as on clicking play btn none of the conditions match');
    }
    video.style.visibility = 'hidden';
    video.style.position = 'absolute';
    video.style.left = '-9999px';
    video.play();

    processingActive = true;
    drawFaceFrames.classList.remove('d-none');
    processFrames.classList.remove('d-none');
    video.addEventListener('loadedmetadata', () => {
      const videoProcessing = document.querySelector('.video-processing');
      videoProcessing.style.width = video.videoWidth + 'px';
      videoProcessing.style.height = video.videoHeight + 'px';
    });
    video.addEventListener('loadeddata', startFaceFiltering);
  };

  const startStream = async (constraints) => {
    stopCurrentStream();
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  };

  const handleStream = (stream) => {
    video.srcObject = stream;
    play.classList.add('d-none');
    videoOff.classList.remove('d-none');
    streamStarted = true;
  };

  cameraOptions.onchange = () => {
    if (!streamStarted) {
      return;
    }
    video.pause();
    cameraChanged = true;
  };


  const stopCurrentStream = () => {
    processingActive = false;
    drawFaceFrames.classList.add('d-none');
    processFrames.classList.add('d-none');
    if(video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
      streamStarted = false;
      play.classList.remove('d-none');
      videoOff.classList.add('d-none');
    }
  };
  videoOff.onclick = stopCurrentStream;

  getCameraSelection();


  //face-detection function
  const detectFaces = async (input_img) => {
    if(!detector){
        console.log('model has not loaded');
        return;
    }
    let result_array = await detector.estimateFaces(input_img, {flipHorizontal: false});
    return result_array;
  };


  //face-alignment-check function
  const faceAlignCheck =  (frame) => {
    const landmarks = frame.keypoints;
    const rightEye = landmarks.find(kp => kp.name === 'rightEye');
    const leftEye = landmarks.find(kp => kp.name === 'leftEye');
    const nose = landmarks.find(kp => kp.name === 'noseTip');
    const mouthCenter = landmarks.find(kp => kp.name === 'mouthCenter');
    const leftEar = landmarks.find(kp => kp.name === 'rightEarTragion');
    const rightEar = landmarks.find(kp => kp.name === 'leftEarTragion');
    

    // Face Alignment Parameters
    const eyeAngleThresh = parseFloat(import.meta.env.VITE_EYE_ANGLE_THRESH);
    const noseMouthLeftThresh = parseFloat(import.meta.env.VITE_NOSE_MOUTH_LEFT_THRESH);
    const noseMouthRightThresh = parseFloat(import.meta.env.VITE_NOSE_MOUTH_RIGHT_THRESH);
    const earDistRatioLeftThresh = parseFloat(import.meta.env.VITE_EAR_DIST_RATIO_LEFT_THRESH);
    const earDistRatioRightThresh = parseFloat(import.meta.env.VITE_EAR_DIST_RATIO_RIGHT_THRESH);
    const mouthEyeNormalizedThresh = parseFloat(import.meta.env.VITE_MOUTH_EYE_NORMALIZED_THRESH);


    //eye alignment check
    const deltaY = leftEye.y-rightEye.y;
    const deltaX = leftEye.x-rightEye.x;
    const eyeAngle = Math.abs((Math.atan2(deltaY,deltaX))*(180/Math.PI));
    //eye mouth vertical symmetry check
    const eyeCenterY = (leftEye.y + rightEye.y)/2;
    const mouthEyeDeltaY = Math.abs(mouthCenter.y - eyeCenterY);
    const noseEyeDeltaY = Math.abs(nose.y - eyeCenterY);
    let noseMouthRatio = 0;
    if (noseEyeDeltaY !== 0) {
      noseMouthRatio = mouthEyeDeltaY / noseEyeDeltaY;
    }
    else{
      noseMouthRatio = float('inf');
    }
    //Ear distance symmetry check
    const distLeftEar = Math.abs(leftEar.x - nose.x);
    const distRightEar = Math.abs(rightEar.x - nose.x);
    let earDistRatio = 0;
    if(distRightEar !== 0){
      earDistRatio = distLeftEar / distRightEar;
    }
    else{
      earDistRatio = float('inf');
    }
    //Mouth Horizontal position symmetry check 
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const mouthEyeDeltaX = Math.abs(mouthCenter.x - eyeCenterX);
    const eyeDistance = Math.sqrt(Math.pow((leftEye.x - rightEye.x), 2) + Math.pow((leftEye.y - rightEye.y), 2));
    
    if(eyeAngle < eyeAngleThresh && 
        noseMouthRatio > noseMouthLeftThresh && noseMouthRatio < noseMouthRightThresh &&
        earDistRatio > earDistRatioLeftThresh && earDistRatio < earDistRatioRightThresh &&
        mouthEyeDeltaX < eyeDistance * mouthEyeNormalizedThresh
    ){
      console.log('face is aligned');
      return true;
    }
    else{
      console.log('face is not aligned');
    } 
    return false;
  };


  const startFaceFiltering = () => {
    
    if (!processingActive) {
      console.log('processing is not active, stopping face filtering');
      return;
    }

    let isFaceAligned = false;
    let faceStatus = false;

    videoProcessing.classList.remove('d-none');
    const ctx2 = drawFaceFrames.getContext('2d');//drawing the video frames from webcam
    drawFaceFrames.width = video.videoWidth;
    drawFaceFrames.height = video.videoHeight;
    ctx2.drawImage(video, 0, 0);
    ctx2.lineWidth = 2;
    ctx2.strokeStyle = 'red';
    registerImagePreview.src = drawFaceFrames.toDataURL('image/png');
    ctx2.stroke();

    if(!detector){
      console.log('model has not loaded)');
      window.requestAnimationFrame(startFaceFiltering);
      return ;
    }

    const ctx1 = processFrames.getContext('2d'); //processing the video frames to detect faces
    processFrames.width = video.videoWidth;
    processFrames.height = video.videoHeight;

    const input = tf.browser.fromPixels(video);
    detectFaces(input).then(resultFaces => {
      if (!resultFaces || resultFaces.length === 0) {
        console.log('no faces detected');
        faceStatus = false;
        isFaceAligned = false;
      } else if (resultFaces.length > 1) {     //only 1 face
        console.log('more than 1 faces detected');
        faceStatus = false;
        isFaceAligned = false;
      } else {
        const frame = resultFaces[0];
        const xTopLeft = frame.box.xMin;
        const yTopLeft = frame.box.yMin;
        const width = frame.box.width;
        const height = frame.box.height;

        ctx1.beginPath();
        ctx1.rect(xTopLeft, yTopLeft, width, height);
        ctx1.lineWidth = 2;
        ctx1.strokeStyle = 'red';
        ctx1.stroke();

        if(frame.keypoints && Array.isArray(frame.keypoints)){
          ctx1.fillStyle = 'lime';
          ctx1.strokeStyle = 'lime';
          frame.keypoints.forEach(kp =>{
            ctx1.beginPath();
            ctx1.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
            ctx1.fill();
          });
        }

        isFaceAligned = faceAlignCheck(frame);
        faceStatus = true;
      
      }
      input.dispose();    //dispose unnecessary the tensors

      if(faceStatus && isFaceAligned){
        console.log('ready for registration');
        stopCurrentStream();
        registerImage();
        return;
      }else{
        window.requestAnimationFrame(startFaceFiltering);
      }
    });
  };

  //function to handle image registration when image is aligned
  const registerImage = () => {
    console.log('inside registerImage()');
    const videoOptions = document.getElementsByClassName('video-options')[0];
    const registerWebcamControls = document.getElementsByClassName('controls')[0];
    const registerStudentBtns = [...document.querySelectorAll('.register-input>button')];
    const responseMessage = document.getElementById('response-message');
    
    const [registerBtn, cancelRegisterBtn, retakePhotoBtn] = registerStudentBtns;

    videoOptions.classList.add('d-none');
    videoProcessing.classList.add('d-none');
    registerWebcamControls.classList.add('d-none');
    
    registerStudent.classList.remove('d-none');

    async function handleregisterBtnClick() {
    
      responseMessage.textContent = "";
      responseMessage.classList.remove('error');
      responseMessage.classList.remove('success');

      registerBtn.disabled = true;
      registerBtn.textContent = "Registering...";

      try{
        const result = await sendImage();


        responseMessage.textContent = result.msg || "Student registered Successfully";
        responseMessage.classList.add('success');

      } catch(err){
         responseMessage.textContent = `Error:  ${err.message}`;
         responseMessage.classList.add('error');
      } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = "Register";
      }
    }
    registerBtn.onclick = handleregisterBtnClick;

    cancelRegisterBtn.onclick = () => {
      sessionStorage.removeItem('newStudentName');
      sessionStorage.removeItem('newStudentRollNo');

      window.location.href = 'add-student-details.html';
    }

    retakePhotoBtn.onclick = () => {
      registerStudent.classList.add('d-none');
      videoOptions.classList.remove('d-none');
      registerWebcamControls.classList.remove('d-none');
      processingActive = true;
      drawFaceFrames.classList.remove('d-none');
      processFrames.classList.remove('d-none');
      video.addEventListener('loadeddata', startFaceFiltering);
    }
  }

  //function to send student details and image to backend
  async function sendImage(){
    
    const baseURL = import.meta.env.VITE_BACKEND_BASE_URL;
    const addStudentEndpoint = import.meta.env.VITE_ADD_STUDENT;
    const endpoint = `${baseURL}${addStudentEndpoint}`;

    const timeoutMs = 25000;
    const filename = "face.png";
    // small helpers
    const isDataURL = (s) => typeof s === 'string' && s.startsWith('data:');
    const safeJson = async (response) => {
      try{
        return await response.json();
      }
      catch{
        const txt = await response.text();
        throw new Error(`Invaid Json Response:  ${txt}`)
      }
    };


    function dataURLToBlob(dataURL) {
      try{
        const [header, base64Data] = dataURL.split(',');
        if (!header || !base64Data) { throw new Error("Invalid Data URL format"); }
        const match = header.match(/:(.*?);/); // Extract "image/png"
        if (!match || match.length<2) { throw new Error("could not read mime type from data url"); }
        const mime = match[1];
        const byteString = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);

        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        return new Blob([arrayBuffer], { type: mime });
      } catch(err) {
        console.error("[dataURLToBlob] Failed:", err);
        throw new Error("Some client error in converting image to Blob");
      }
    } 
    // Early validations
    if (!registerImagePreview || !registerImagePreview.src) {
      console.error("[sendImage] No image to send");
      throw new Error("First click image");
    }
    let inputBlob = null;
    try{
      if (isDataURL(registerImagePreview.src)){
        inputBlob = dataURLToBlob(registerImagePreview.src);
        if (!inputBlob) {throw new Error("failed to convert data url to blob");}
      }
      else {
        const fetched = await fetch(registerImagePreview.src);
        if (!fetched.ok) {throw new Error(`Failed to fetch image: ${fetched.status} ${fetched.statusText}`);}
        inputBlob = await fetched.blob();
      }
    }catch(err){
      console.error("sendImage: failed to obtain blob from image src", err);
      throw new Error("Some image Error");
    }
    
    const formData = new FormData();
    formData.append("image", inputBlob, filename);
    formData.append("data", studentDetails);

    // Timeout handling
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    try{
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal, 
      });
      clearTimeout(timeout);

      if(!response.ok){
        const payload = await safeJson(response);
        console.error("sendImage: backend returned error", {
          status: response.status,
          statusText: response.statusText,
          payload,
        });
        throw new Error(
          typeof payload === "string"
          ? payload
          : payload?.message || JSON.stringify(payload) || "Server returned an error"
        );

      }

      const result = await safeJson(response);
      console.log("sendImage: Success",result);
      return result;
    } catch(err){
      clearTimeout(timeout);
      if (err.name === 'AbortError'){
        console.error("sendImage: Request timed out after", timeoutMs, "ms");
        throw new Error("Request timed out");
      } else{
        console.error(`Error:" ${err.message}`);
        throw err;
      }
    }
  }
});