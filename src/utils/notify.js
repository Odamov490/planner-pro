export function requestPermission(){
 if(Notification.permission!=="granted"){
  Notification.requestPermission();
 }
}

export function notify(text){
 if(Notification.permission==="granted"){
  new Notification("Eslatma",{body:text});
 }
}
