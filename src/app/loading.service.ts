import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  
  public m_IDModulo: string="TGSI_THMALPI_PAN";
  public m_UsuarioApp: string="OBALPITHM";
  public m_PasswordApp: string="DsSJyz/sPzurKMw3jzqFZKhg/BbhwCbj0ykiJGBQQz0=";
  public m_CodigoWSApp: string ="TGSI_THMALPI_PAN";
  public m_IMEI: string="";
  public m_UrlWS: string="https://alpicovid.azurewebsites.net/vip/WsAlpina.asmx";


  public m_Nombres: string="";
  public m_Cargo: string="";


  isLoading = false;

  constructor(public loadingController: LoadingController) { }

  async present() {
    this.isLoading = true;
    return await this.loadingController.create({
      //duration: 5000,
      message: 'Oberón Procesando...',
      translucent: true,
      spinner: 'dots'
    }).then(a => {
      a.present().then(() => {
        console.log('presented');
        if (!this.isLoading) {
          a.dismiss().then(() => console.log('abort presenting'));
        }
      });
    });
  }

  async presentTxt(stRMensaje: string) {
    this.isLoading = true;
    return await this.loadingController.create({
      //duration: 5000,
      message: stRMensaje,
      translucent: true,
      spinner: 'dots'
    }).then(a => {
      a.present().then(() => {
        console.log('presented');
        if (!this.isLoading) {
          a.dismiss().then(() => console.log('abort presenting'));
        }
      });
    });
  }
  async dismiss() {
    this.isLoading = false;
    return await this.loadingController.dismiss().then(() => console.log('dismissed'));
  }
}
