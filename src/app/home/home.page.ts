import { Component } from '@angular/core';
import { LoadingService } from '../loading.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { ToastController } from '@ionic/angular';

import { Platform, AlertController } from '@ionic/angular';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  stLClrFondo: string = "";
  stLClrFondoPan: string = "red";
  stLColorAsistencia: string = "secondary";
  inLLinterna: number = 0;
  dataAux: any;
  stLUrl: string = "";
  stLEstado: string = "INACTIVO";
  inLCount: number = 0;
  inLActivo: number = 0;
  name: string = "";
  timeoutHandler: any;
  timeoutHandlerAux: any;
  geoposition: any;
  lat: any;
  lng: any;
  backButtonSubscription: any
  private dataPerson: any;

  //---------------------------------------
  public appMenu = [
    {
      id: '1',
      title: 'Apertura y Cierre de Turnos',
      description: 'No Olvidar Abrir y Cerrar su Turno',
      url: '/asistencia/empleados/',
      direct: 'root',
      icon: 'assets/img/Menu/house01sq.jpg',
      turno: "turno",
      turnoC: "ST"
    },
    {
      id: '2',
      title: 'Directorio Telefónico',
      description: 'Contactos de la Instalación',
      url: '/directorio/',
      direct: 'directorio',
      icon: 'assets/img/Menu/house02sq.jpg',
      turno: "turno",
      turnoC: "ST"
    }


  ];
  //---------------------------------------

  constructor(private loading: LoadingService, private toastCtrl: ToastController, private Http: HttpClient,
    private geolocation: Geolocation, private platform: Platform, public alertController: AlertController) {
    this.GetEstadoSOS();

  }
  onLlamar() {
    this.GetTelCentral();
  }

  async presentToast(stRMensaje: string) {
    const toast = await this.toastCtrl.create({
      message: stRMensaje,
      duration: 4000
    });
    toast.present();
  }
  private GetTelCentral() {


    this.loading.presentTxt('Oberón Obteniendo Telefóno del Centro de Control ...');
    this.SrBuscaTelCentral().then((data: any) => {
      if (data["Table"] != null) {
        this.dataAux = data["Table"];
        this.loading.dismiss();
        console.log(data["Table"]);
        if (data["Table"][0].Error_Code == '0') {
          let stLTelefono = data["Table"][0].CODIR_TELEFONO;
          if (stLTelefono != "") {
            this.loading.dismiss();
            // this.callNumber.callNumber(stLTelefono, true)
            window.open('tel:' + stLTelefono, '_system');



          }
          else {
            this.loading.dismiss();
            alert("NO Tiene Asignado el Número del Centro de Control. Contacte al Administrador")

          }
        }
        else {
          alert('Error al Consultar Teléfono ');
        }
      }
      else {
        this.loading.dismiss();
      }
    });


  }

  private SrBuscaTelCentral() {
    this.loading.presentTxt('Oberón Obteniendo Telefóno de la Central de Operaciones...');
    let options = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };
    this.stLUrl = this.loading.m_UrlWS + '/GetTelCentral';
    let headers = new Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    let params = 'stRStatus=1&stRUsuarioAPP=' + this.loading.m_UsuarioApp + '&stRPasswordAPP=' + this.loading.m_PasswordApp + '&stRCodigoWSAPP=' + this.loading.m_CodigoWSApp;

    return new Promise(resolve => {
      //this.Http.get(this.stLUrl+'?'+params,{headers: headers}).subscribe(data => {
      this.Http.post(this.stLUrl, params, options).subscribe(data => {
        if (data != null) {
          resolve(data);
        }
        else
          resolve(false);
      });
    });

  }
  private onPanico() {
    this.stLColorAsistencia = "warning";
    let timeInMs = 5000;
    let timeout = setTimeout(() => {
      //alert("Hola");
      this.stLColorAsistencia = "danger";
    }, timeInMs);
  }

  closeApp() {

    this.platform.backButton.subscribeWithPriority(10, (processNextHandler) => {
      console.log('Back press handler!');

      processNextHandler();

    });
    this.platform.backButton.subscribeWithPriority(5, () => {
      console.log('Handler called to force close!');
      this.alertController.getTop().then(r => {
        if (r) {
          // navigator['app'].exitApp();

        }
      }).catch(e => {
        console.log(e);
      })
    });
  }
  ngOnDestroy() {
    this.backButtonSubscription.unsubscribe();
  }

  holdCount() {
    //alert("Entra");
    if (this.inLActivo == 0) {
      this.stLColorAsistencia = "warning";
      this.stLEstado = "ACTIVANDO";

      this.timeoutHandler = setInterval(() => {
        ++this.inLCount;
        //this.onActivar();
      }, 1000);
    }

  }

  private onActivar() {
    this.stLColorAsistencia = "danger";
    this.stLEstado = "ACTIVO";
    this.inLActivo = 1;

    const options = {
      timeout: 10000,
      enableHighAccuracy: true,
      maximumAge: 7200
    };
    /*
      const subscription = this.geolocation.watchPosition(options).subscribe(position => {
        if ((position as Geoposition).coords != undefined) {
           this.geoposition = (position as Geoposition);
          this.lat=this.geoposition.coords.latitude;
          this.lng=this.geoposition.coords.longitude;

          //console.log('Latitude: ' + this.geoposition.coords.latitude + ' - Longitude: ' + this.geoposition.coords.longitude);
        } else {
          var positionError = (position as PositionError);
          //alert('Error ' + positionError.code + ': ' + positionError.message);
        }
    });
    */
    this.SrProcesaSOS();


    let timeInMs = 40000;

    this.timeoutHandlerAux = setInterval(() => {
      this.SrProcesaSOS();
      //this.GetEstadoSOS();
    }, timeInMs);

    let timeInMsAux = 30000;

    this.timeoutHandlerAux = setInterval(() => {
      //this.SrProcesaSOS();
      this.GetEstadoSOSAux();
    }, timeInMsAux);


    /*
        this.backgroundMode.on('activate').subscribe(() => {
          this.backgroundMode.disableWebViewOptimizations();
          //this.backgroundMode.disableBatteryOptimizations();
          setInterval(() => {
            this.SrProcesaSOS();
            //this.GetEstadoSOS();

                  },30000);
        });

    */
    //this.SrSegundo_plano();
  }
  endCount() {

    if (this.inLActivo == 0) {
      if (this.inLCount >= 1) {
        this.onActivar();
        //this.backgroundMode.enable();
      }
      else {
        this.stLColorAsistencia = "secondary";
        this.stLEstado = "INACTIVO";
        if (this.timeoutHandler) {
          //alert(this.inLCount);
          clearTimeout(this.timeoutHandler);
          this.timeoutHandler = null;
          this.inLCount = 0;
          this.inLActivo = 0;
        }
      }
    }


    /*
    alert(this.inLCount);
    if(this.inLActivo==0)
    {
     this.stLColorAsistencia="secondary";
     this.stLEstado="INACTIVO";
    }

    this.inLCount=0;
    */

    /*
    else{
     let timeInMs = 5000;
     let timeout= setTimeout( () => {
         alert("Hola");
         this.stLColorAsistencia="danger";
     }, timeInMs );

    }
   /*
   this.stLColorAsistencia="danger";
   this.stLEstado="ACTIVO";

   alert(this.timeoutHandler);
   */




  }

  private SrProcesaSOS() {
    this.loading.presentTxt('Oberón Enviando SOS ...');
    this.SrIngresaSOS().then((data: any) => {
      if (data["Table"] != null) {
        this.dataPerson = data["Table"];
        this.loading.dismiss();
        console.log(data["Table"]);
        if (data["Table"][0].Error_Code == '0') {
          this.presentToast('S.O.S');


          //this.closeModal();
        }
        else {
          alert('Error al Reportar S.O.S');
        }
      }
      else {
        this.loading.dismiss();
      }
    });
  }

  private SrIngresaSOS() {
    this.stLUrl = this.loading.m_UrlWS + '/Put_Alertas';
    let headers = new HttpHeaders();
    let options = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };


    let params = 'stRReferencia=' + this.loading.m_IMEI + '&stRTipo=1&stRLatitud=' + this.lat + '&stRLongitud=' + this.lng + '&stRUbicacion=0&stRStatus=1&stRUsuarioAPP=' + this.loading.m_UsuarioApp + '&stRPasswordAPP=' + this.loading.m_PasswordApp + '&stRCodigoWSAPP=' + this.loading.m_CodigoWSApp;

    //console.log(this.stLUrl+'?'+params);
    return new Promise(resolve => {
      //this.Http.get(this.stLUrl+'?'+params,{headers: headers}).subscribe(data => {
      this.Http.post(this.stLUrl, params, options).subscribe(data => {
        if (data != null) {
          resolve(data);
        }
        else
          resolve(false);
      });
    });
  }

  private GetEstadoSOSAux() {


    this.loading.presentTxt('Oberón Obteniendo Estado SOS ...');
    this.SrBuscaEstadoSOS().then((data: any) => {
      if (data["Table"] != null) {
        this.dataAux = data["Table"];
        this.loading.dismiss();

        if (data["Table"][0].Error_Code == '0') {
          //this.inLActivo=data["Table"][0].ESTADO;
          this.inLActivo = 1;


        }
        else {
          this.stLColorAsistencia = "secondary";
          this.stLEstado = "INACTIVO";
          this.inLCount = 0;
          this.inLActivo = 0;
          //this.backgroundMode.disable();
        }
      }
      else {
        this.loading.dismiss();
      }
    });


  }

  private GetEstadoSOS() {


    this.loading.presentTxt('Oberón Obteniendo Estado SOS ...');
    this.SrBuscaEstadoSOS().then((data: any) => {
      if (data["Table"] != null) {
        this.dataAux = data["Table"];
        this.loading.dismiss();

        if (data["Table"][0].Error_Code == '0') {
          //this.inLActivo=data["Table"][0].ESTADO;
          this.inLActivo = 1;
          this.onActivar();
          //this.backgroundMode.enable();
        }
        else {
          this.stLColorAsistencia = "secondary";
          this.stLEstado = "INACTIVO";
          this.inLCount = 0;
          this.inLActivo = 0;
          //this.backgroundMode.disable();
        }
      }
      else {
        this.loading.dismiss();
      }
    });


  }

  private SrBuscaEstadoSOS() {
    //this.loading.presentTxt('Oberón Obteniendo Telefóno de la Central de Operaciones...');
    let options = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };
    this.stLUrl = this.loading.m_UrlWS + '/get_Estado_SOS';
    let headers = new Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    let params = 'stRReferencia=' + this.loading.m_IMEI + '&stRUsuarioAPP=' + this.loading.m_UsuarioApp + '&stRPasswordAPP=' + this.loading.m_PasswordApp + '&stRCodigoWSAPP=' + this.loading.m_CodigoWSApp;

    return new Promise(resolve => {
      //this.Http.get(this.stLUrl+'?'+params,{headers: headers}).subscribe(data => {
      this.Http.post(this.stLUrl, params, options).subscribe(data => {
        if (data != null) {
          resolve(data);
        }
        else
          resolve(false);
      });
    });

  }

}
