import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastController, NavController, AlertController } from '@ionic/angular';
import { LoadingService } from '../loading.service';
import { Router } from '@angular/router';

import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { Geolocation } from '@capacitor/geolocation';
import { App } from '@capacitor/app';
import { registerPlugin } from "@capacitor/core";
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  stLIdentifica: string = "";
  stLNombres: string = "";
  stLApellidos: string = "";
  stLCelular: string = "";
  stLUIDD: string = "";
  stLUIDDAux: any;
  stLCargo: string = "";
  stLEmail: string = "";
  stLContrasena: string = "";
  dataPerson: any;
  stLUrl: string = "";
  stLClrFondoPan: string = "red";

  stLClrFondo: string = "";
  stLColorAsistencia: string = "secondary";
  inLLinterna: number = 0;
  dataAux: any;
  dataAux1: any;
  stLEstado: string = "INACTIVO";
  inLCount: number = 0;
  inLActivo: number = 0;
  name: string = "";
  timeoutHandler: any;
  timeoutHandlerAux: any;
  geoposition: any;
  lat: any;
  lng: any;
  backButtonSubscription: any;



  stLIMEI: string = "";
  UniqueDeviceID: string = "";

  stLACCESO: string = "0";





  onRegistro: UntypedFormGroup = this.formBuilder.group({
    stLIdentifica: [null, Validators.required],
    stLNombres: [null, Validators.required],
    stLApellidos: [null, Validators.required],
    stLCelular: [null, Validators.required],
    stLCargo: [null, Validators.required],
    stLEmail: [null, Validators.required]
  });
  onContrasena: UntypedFormGroup = this.formBuilder.group({
    stLContrasena: [null, Validators.required]
  });

  constructor(
    private formBuilder: UntypedFormBuilder,
    private http: HttpClient,
    private toastCtrl: ToastController,
    private nav: NavController,
    private loading: LoadingService,
    private router: Router,
    private alertController: AlertController
  ) { }

  async presentAlertConfirm() {
    const infoAux: any = await Device.getId();
    this.stLUIDD = infoAux.uuid;

    await Preferences.set({
      key: 'obUUID',
      value: this.stLUIDD,
    });

    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Autorización de USO',
      message: 'Esta aplicación utiliza sus datos de ubicación, para que nuestros usuarios VIP, puedan tener asistencia lo más pronto posible. Ejemplo: Si usted está siendo víctima de robo, al presionar este botón de pánico nuestro personal lo asistirá en su ubicación en tiempo real en el menor tiempo posible. Presione en "Autoriza" Para Continuar',
      buttons: [
        {
          text: 'NO Autorizo',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            App.exitApp();
          }
        }, {
          text: 'Autoriza',
          handler: () => {
            console.log('Confirm Okay');
            this.ValidaPermisos();
            this.SrConsultaIMEI(this.stLUIDD);
          }
        }
      ]
    });

    await alert.present();
  }

  async ValidaPermisos() {
    const info = await Device.getInfo();
    const infoAux: any = await Device.getId();
    this.stLUIDD = infoAux.uuid;

    await Preferences.set({
      key: 'obUUID',
      value: this.stLUIDD,
    });

    const permissions = await Geolocation.requestPermissions();
    if (permissions.location === 'granted') {
      this.SrValidacionAPP();
    } else {
      alert("Dispositivo SIN GPS, Por Favor Activelo");
    }
  }

  async ngOnInit() {
    this.onRegistro = this.formBuilder.group({
      stLIdentifica: [null, Validators.required],
      stLNombres: [null, Validators.required],
      stLApellidos: [null, Validators.required],
      stLCelular: [null, Validators.required],
      stLCargo: [null, Validators.required],
      stLEmail: [null, Validators.required]
    });

    this.onContrasena = this.formBuilder.group({
      stLContrasena: [null, Validators.required]
    });

    const infoInternet = await Network.getStatus();
    if (infoInternet.connected) {
      this.SrValidacionAPP();
    } else {
      alert("Dispositivo SIN INTERNET, Por Favor Activelo");
      App.exitApp();
    }

    Network.addListener('networkStatusChange', (status) => {
      if (status.connected) {
        alert("CON Internet");
        this.SrValidacionAPP();
      } else {
        alert("SIN Internet");
        App.exitApp();
      }
    });
  }

  async SrValidacionAPP() {
    const CPermisoGPS = await Geolocation.checkPermissions();
    if (CPermisoGPS.location === 'granted') {
      const infoAux: any = await Device.getId();
      this.stLUIDD = infoAux.uuid;
      this.SrConsultaIMEI(this.stLUIDD);
    } else {
      this.presentAlertConfirm();
    }
  }

  private async SrConsultaIMEI(data: string) {
    this.stLUIDD = data;
    this.SrConsultaPersona().then((data: any) => {
      if (data["Table"] != null) {
        this.dataPerson = data["Table"];
        this.loading.dismiss();
        if (data["Table"][0].Error_Code == '0') {
          if (data["Table"][0].CLIMEI_ESTADO == '0' || data["Table"][0].CLIMEI_ESTADO == '1') {
            this.presentToast('Por Favor Ingrese su Contraseña Enviada al Correo Registrado en la Solicitud');
          }
          if (data["Table"][0].CLIMEI_ESTADO == '2') {
            this.presentToast('Bienvenido Señor(a): ' + data["Table"][0].PERSO_NOMBRES + " " + data["Table"][0].PERSO_APELLIDOS);
            this.loading.m_Nombres = data["Table"][0].PERSO_NOMBRES;
            this.loading.m_Cargo = data["Table"][0].PERSO_CARGOID;
            this.loading.m_IMEI = this.stLUIDD;
            this.SrSegundoPlano();
            this.GetEstadoSOS();
          }
        } else {
          alert('Error al Consultar Registro ');
        }
      } else {
        this.loading.dismiss();
      }
    });
  }

  private SrConsultaPersona() {
    this.stLUrl = this.loading.m_UrlWS + '/Get_IMEIvip';
    let headers = new HttpHeaders();
    let options = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };
    let params = 'stRIMEI=' + this.stLUIDD + '&stRUsuarioAPP=' + this.loading.m_UsuarioApp + '&stRPasswordAPP=' + this.loading.m_PasswordApp + '&stRCodigoWSAPP=' + this.loading.m_CodigoWSApp;

    return new Promise(resolve => {
      this.http.post(this.stLUrl, params, options).subscribe(data => {
        if (data != null) {
          resolve(data);
        } else {
          resolve(false);
        }
      });
    });
  }

  async presentToast(stRMensaje: string) {
    const toast = await this.toastCtrl.create({
      message: stRMensaje,
      duration: 4000
    });
    toast.present();
  }

  SrProcesaIngreso() {
    this.loading.presentTxt('Oberón Guardando Registro VIP ...');
    this.SrIngresaPersona().then((data: any) => {
      if (data["Table"] != null) {
        this.dataPerson = data["Table"];
        this.loading.dismiss();
        if (data["Table"][0].Error_Code == '0') {
          this.presentToast('Registro Guardado Satisfactoriamente');
          Preferences.set({ key: 'obUUID', value: this.stLUIDD });
          Preferences.set({ key: 'obNombres', value: this.stLNombres });
          Preferences.set({ key: 'obApellidos', value: this.stLApellidos });
          Preferences.set({ key: 'obCargo', value: this.stLCargo });
          Preferences.set({ key: 'obCelular', value: this.stLCelular });
          this.SrConsultaIMEI(this.stLUIDD);
        } else {
          alert('Error al Solicitar Registro ');
        }
      } else {
        this.loading.dismiss();
      }
    });
  }

  private SrIngresaPersona() {
    this.stLUrl = this.loading.m_UrlWS + '/Put_PersonasVIP_V2';
    let headers = new HttpHeaders();
    let options = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };
    let params = 'stRPersona=' + this.stLIdentifica + '&stRIMEIAux=' + this.stLUIDD + '&stRApellidos=' + this.stLApellidos + '&stRNombres=' + this.stLNombres + '&stRCargo=' + this.stLCargo + '&stRTelefono=' + this.stLCelular + '&stREmail=' + this.stLEmail + '&stREstado=0&stRUsuarioAPP=' + this.loading.m_UsuarioApp + '&stRPasswordAPP=' + this.loading.m_PasswordApp + '&stRCodigoWSAPP=' + this.loading.m_CodigoWSApp;

    return new Promise(resolve => {
      this.http.post(this.stLUrl, params, options).subscribe(data => {
        if (data != null) {
          resolve(data);
        } else {
          resolve(false);
        }
      });
    });
  }

  SrProcesaContrasena() {
    this.loading.presentTxt('Oberón Guardando Contraseña VIP ...');
    this.SrIngresaContrasena().then((data: any) => {
      if (data["Table"] != null) {
        this.dataPerson = data["Table"];
        this.loading.dismiss();
        if (data["Table"][0].Error_Code == '0' && data["Table"][0].CLIMEI_ESTADO == '2') {
          this.presentToast('Contrasena Aplicada Satisfactoriamente');
          Preferences.set({ key: 'obContrasena', value: this.stLContrasena });
          this.SrConsultaIMEI(this.stLUIDD);
        } else {
          alert('Error al Registrar Contraseña ');
        }
      } else {
        this.loading.dismiss();
      }
    });
  }

  private SrIngresaContrasena() {
    this.stLUrl = this.loading.m_UrlWS + '/Put_MEI_VIP_ACCESS';
    let headers = new HttpHeaders();
    let options = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };
    let params = 'stRIMEI=' + this.stLUIDD + '&stRPassword=' + this.stLContrasena + '&stRUsuarioAPP=' + this.loading.m_UsuarioApp + '&stRPasswordAPP=' + this.loading.m_PasswordApp + '&stRCodigoWSAPP=' + this.loading.m_CodigoWSApp;

    return new Promise(resolve => {
      this.http.post(this.stLUrl, params, options).subscribe(data => {
        if (data != null) {
          resolve(data);
        } else {
          resolve(false);
        }
      });
    });
  }

  onLlamar() {
    this.GetTelCentral();
  }

  private GetTelCentral() {
    this.loading.presentTxt('Oberón Obteniendo Telefóno del Centro de Control ...');
    this.SrBuscaTelCentral().then((data: any) => {
      if (data["Table"] != null) {
        this.dataAux = data["Table"];
        this.loading.dismiss();
        if (data["Table"][0].Error_Code == '0') {
          let stLTelefono = data["Table"][0].CODIR_TELEFONO;
          if (stLTelefono != "") {
            this.loading.dismiss();
            // App.openUrl({ url: `tel:${stLTelefono}` });
            window.location.href = `tel:${stLTelefono}`;
          } else {
            this.loading.dismiss();
            alert("NO Tiene Asignado el Número del Centro de Control. Contacte al Administrador")
          }
        } else {
          alert('Error al Consultar Teléfono ');
        }
      } else {
        this.loading.dismiss();
      }
    });
  }

  private SrBuscaTelCentral() {
    let options = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };
    this.stLUrl = this.loading.m_UrlWS + '/GetTelCentral';
    let params = 'stRStatus=1&stRUsuarioAPP=' + this.loading.m_UsuarioApp + '&stRPasswordAPP=' + this.loading.m_PasswordApp + '&stRCodigoWSAPP=' + this.loading.m_CodigoWSApp;

    return new Promise(resolve => {
      this.http.post(this.stLUrl, params, options).subscribe(data => {
        if (data != null) {
          resolve(data);
        } else {
          resolve(false);
        }
      });
    });
  }

  SrPanico() {
    this.SrProcesaSOS();
    this.onActivar();
  }

  private SrProcesaSOS() {
    this.SrIngresaSOS().then((data: any) => {
      if (data["Table"] != null) {
        this.dataPerson = data["Table"];
        console.log(data["Table"]);
        if (data["Table"][0].Error_Code == '0') {
          this.presentToast('S.O.S');
        } else {
          alert('Error al Reportar S.O.S');
        }
      }
    });
  }

  async SrIngresaSOS() {
    this.stLUrl = this.loading.m_UrlWS + '/Put_Alertas';
    let headers = new HttpHeaders();
    let options = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };

    const coordinates = await Geolocation.getCurrentPosition();
    let params = 'stRReferencia=' + this.stLUIDD + '&stRTipo=1&stRLatitud=' + coordinates.coords.latitude + '&stRLongitud=' + coordinates.coords.longitude + '&stRUbicacion=0&stRStatus=1&stRUsuarioAPP=' + this.loading.m_UsuarioApp + '&stRPasswordAPP=' + this.loading.m_PasswordApp + '&stRCodigoWSAPP=' + this.loading.m_CodigoWSApp;

    return new Promise(resolve => {
      this.http.post(this.stLUrl, params, options).subscribe(data => {
        if (data != null) {
          resolve(data);
        } else {
          resolve(false);
        }
      });
    });
  }
  async SrSegundoPlano() {
    const config = {
      desiredAccuracy: 10,
      stationaryRadius: 20,
      distanceFilter: 30,
      debug: false,
      stopOnTerminate: false,
      notificationTitle: 'Oberón',
      notificationText: 'Servicio Activo',
    };
    const BackgroundGeolocation: any = registerPlugin("BackgroundGeolocation");


    try {
      await BackgroundGeolocation.addWatcher(
        config,
        (location: any, error: any) => {
          if (error) {
            console.error(error);
            return;
          }
          this.SrProcesaTracking();
          BackgroundGeolocation.removeWatcher({ id: 'my_watcher_id' }); // Replace with the actual watcher ID if needed
        },
        {
          id: 'my_watcher_id', // Optional watcher ID
          backgroundMessage: 'Background tracking is running...',
          backgroundTitle: 'Tracking',
          requestPermissions: true,
          stale: false,
        }
      );
    } catch (err) {
      console.error('Error adding watcher:', err);
    }
  }
  private SrProcesaTracking() {
    this.SrIngresaTracking().then((data: any) => {
      if (data["Table"] != null) {
        this.dataPerson = data["Table"];
        if (data["Table"][0].Error_Code == '0') {
          // this.presentToast('Tracking');
        }
      }
    });
  }

  async SrIngresaTracking() {
    this.stLUrl = this.loading.m_UrlWS + '/Put_Tracking';
    let headers = new HttpHeaders();
    let options = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };

    const coordinates = await Geolocation.getCurrentPosition();
    let params = 'stRDispositivo=' + this.stLUIDD + '&stRLatitud=' + coordinates.coords.latitude + '&stRLongitud=' + coordinates.coords.longitude + '&stRUsuarioAPP=' + this.loading.m_UsuarioApp + '&stRPasswordAPP=' + this.loading.m_PasswordApp + '&stRCodigoWSAPP=' + this.loading.m_CodigoWSApp;

    return new Promise(resolve => {
      this.http.post(this.stLUrl, params, options).subscribe(data => {
        if (data != null) {
          resolve(data);
        } else {
          resolve(false);
        }
      });
    });
  }

  private onActivar() {
    this.inLActivo = 1;
    this.stLColorAsistencia = "danger";
    this.stLEstado = "ACTIVO";

    const options = {
      timeout: 10000,
      enableHighAccuracy: true,
      maximumAge: 7200
    };

    let timeInMs = 39000;
    this.timeoutHandlerAux = setInterval(() => {
      this.GetEstadoSOS();
    }, timeInMs);

    let timeInMsAux = 40000;
    this.timeoutHandlerAux = setInterval(() => {
      if (this.inLActivo == 1) {
        this.SrProcesaSOS();
      }
    }, timeInMsAux);
  }

  private GetEstadoSOS() {
    this.SrBuscaEstadoSOS().then((data: any) => {
      if (data["Table"] != null) {
        this.dataAux1 = data["Table"][0];
        if (this.dataAux1.Error_Code == '0') {
          this.inLActivo = this.dataAux1.ALERTA_ACTIVA;
          if (this.inLActivo == 1) {
            this.onActivar();
          }
          if (this.inLActivo == 0) {
            this.stLColorAsistencia = "secondary";
            this.stLEstado = "INACTIVO";
            clearTimeout(this.timeoutHandler);
            this.timeoutHandler = null;
            clearTimeout(this.timeoutHandlerAux);
            this.timeoutHandlerAux = null;
            this.inLCount = 0;
            this.inLActivo = 0;
          }
        } else {
          this.stLColorAsistencia = "secondary";
          this.stLEstado = "INACTIVO";
          clearTimeout(this.timeoutHandler);
          this.timeoutHandler = null;
          clearTimeout(this.timeoutHandlerAux);
          this.timeoutHandlerAux = null;
          this.inLCount = 0;
          this.inLActivo = 0;
        }
      }
    });
  }

  private SrBuscaEstadoSOS() {
    let options = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };
    this.stLUrl = this.loading.m_UrlWS + '/Get_Alerta_Activa';
    let params = 'stRImei=' + this.stLUIDD + '&stRUsuarioAPP=' + this.loading.m_UsuarioApp + '&stRPasswordAPP=' + this.loading.m_PasswordApp + '&stRCodigoWSAPP=' + this.loading.m_CodigoWSApp;

    return new Promise(resolve => {
      this.http.post(this.stLUrl, params, options).subscribe(data => {
        if (data != null) {
          resolve(data);
        } else {
          resolve(false);
        }
      });
    });
  }
}
