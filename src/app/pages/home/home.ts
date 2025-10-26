import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  recordId = '';
  patientName = '';
  patientInfo = '';
  date: string = '';
  modalities = { CT: false, MRI: false };
  locations = { RUL: false, RML: false, RLL: false, LUL: false, LLL: false, Other: '' };
  size = { type: '', value: '' };
  T: { [key: string]: boolean } = {
    Tx: false, T0: false, Tis: false,
    T1mi: false, T1a: false, T1b: false, T1c: false,
    T2a: false, T2b: false, T3: false, T3invade: false, T3nodule: false,
    T4: false, T4invade: false, T4nodule: false
  };
  N: { [key: string]: boolean } = {
    NX: false, N0: false, N1: false, N2: false, N2a: false, N2b: false, N3: false
  };
  M: { [key: string]: boolean } = {
    M0: false, M1: false, M1a: false, M1b: false, M1c: false, M1c1: false, M1c2: false
  };
  otherFinding = '';
  IMP = { T: '', N: '', M: '' };

  constructor(private http: HttpClient, private router: Router) {}


  ngOnInit() {
    this.autofillFromLocalStorage();
  }

  // ---- 驗證表單 ----
  validateForm(): boolean {
    const missing: string[] = [];

    if (!this.recordId.trim()) missing.push('病歷編號');
    if (!this.patientName.trim()) missing.push('患者姓名');
    if (!this.patientInfo.trim()) missing.push('患者資料');
    if (!this.date) missing.push('檢查日期');

    if (!this.modalities.CT && !this.modalities.MRI)
      missing.push('Imaging Modality（至少勾選一項）');

    const anyLocationChecked = this.locations.RUL || this.locations.RML || this.locations.RLL ||
      this.locations.LUL || this.locations.LLL;
    if (!anyLocationChecked && !this.locations.Other.trim())
      missing.push('Tumor Location（請勾選至少一項或填寫 Other）');

    if (!this.size.type) missing.push('Tumor Size（請擇一勾選 Non-measurable 或 Measurable）');
    if (this.size.type === 'Measurable' && !this.size.value.trim())
      missing.push('Tumor Size（Measurable 必須填寫數值）');
    if (this.size.type === 'Non-measurable' && this.size.value.trim())
      missing.push('請勿在 Measurable 欄位輸入數值（已選擇 Non-measurable）');

    if (!Object.values(this.T).some(v => v))
      missing.push('Tumor Invasion (T Classification)（至少勾選一項）');
    if (!Object.values(this.N).some(v => v))
      missing.push('Regional Lymph Node (N Classification)（至少勾選一項）');
    if (!Object.values(this.M).some(v => v))
      missing.push('Distant Metastasis (M Classification)（至少勾選一項）');

    if (!this.IMP.T.trim()) missing.push('IMP 欄位 T（不可空白）');
    if (!this.IMP.N.trim()) missing.push('IMP 欄位 N（不可空白）');
    if (!this.IMP.M.trim()) missing.push('IMP 欄位 M（不可空白）');

    if (missing.length > 0) {
      alert(`請先完成以下必填欄位：\n• ${missing.join('\n• ')}`);
      return false;
    }

    return true;
  }

  // ---- 自動填寫 localStorage ----
  autofillFromLocalStorage() {
    const raw = localStorage.getItem('generatedReport');
    if (!raw) return;

    let report: any;
    try { report = JSON.parse(raw); } catch { return; }

    // 日期轉成 YYYY-MM-DD
    if (report.imaging_date) {
      const d = new Date(report.imaging_date);
      if (!isNaN(d.getTime())) {
        this.date = d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
      } else {
        this.date = report.imaging_date; // fallback
      }
    }

    this.recordId = report.record_id || '';
    this.patientName = report.patient_name || '';
    this.patientInfo = report.patient_info || '';
    this.date = report.imaging_date || '';
    this.modalities.CT = report["Imaging Modality"] === 'CT';
    this.modalities.MRI = report["Imaging Modality"] === 'MRI';

    this.IMP.T = report.imp?.T || '';
    this.IMP.N = report.imp?.N || '';
    this.IMP.M = report.imp?.M || '';

    if (report.T_stage) this.autoCheckStage(this.T, report.T_stage);
    if (report.N_stage) this.autoCheckStage(this.N, report.N_stage);
    if (report.M_stage) this.autoCheckStage(this.M, report.M_stage);

    if (report.tumor_location) {
      const codes = report.tumor_location.toUpperCase().split(',').map((s: string) => s.trim());
      this.locations.RUL = codes.includes('RUL');
      this.locations.RML = codes.includes('RML');
      this.locations.RLL = codes.includes('RLL');
      this.locations.LUL = codes.includes('LUL');
      this.locations.LLL = codes.includes('LLL');
      const other = codes.find((c: string) => !['RUL','RML','RLL','LUL','LLL'].includes(c));

      if (other) this.locations.Other = other;
    }

    if (report.tumor_size_cm) {
      if (report.tumor_size_cm.toLowerCase().includes('non')) {
        this.size.type = 'Non-measurable';
      } else {
        this.size.type = 'Measurable';
        this.size.value = report.tumor_size_cm;
      }
    }

    this.otherFinding = report.other_findings || '';

    this.before_saveForm();
  }

  autoCheckStage(stageObj: { [key: string]: boolean }, val: string) {
    const codes = val.toUpperCase().split(',').map(s => s.trim());
    Object.keys(stageObj).forEach(key => {
      stageObj[key] = codes.includes(key.toUpperCase());
    });
  }

  // ---- 儲存表單 ----
  saveForm() {
    if (!this.validateForm()) return;

    const tumorLocation: string[] = [];
    if (this.locations.RUL) tumorLocation.push('RUL');
    if (this.locations.RML) tumorLocation.push('RML');
    if (this.locations.RLL) tumorLocation.push('RLL');
    if (this.locations.LUL) tumorLocation.push('LUL');
    if (this.locations.LLL) tumorLocation.push('LLL');
    if (this.locations.Other.trim()) tumorLocation.push(this.locations.Other.trim());

    const tStage = (Object.keys(this.T) as string[]).filter(k => this.T[k]);
    const nStage = (Object.keys(this.N) as string[]).filter(k => this.N[k]);
    const mStage = (Object.keys(this.M) as string[]).filter(k => this.M[k]);

    const result = {
      record_id: this.recordId.trim(),
      patient_name: this.patientName.trim(),
      patient_info: this.patientInfo.trim(),
      imaging_date: this.date,
      tumor_location: tumorLocation.join(', '),
      tumor_size_cm: this.size.type === 'Measurable' ? this.size.value : this.size.type,
      T_stage: tStage.join(', '),
      N_stage: nStage.join(', '),
      M_stage: mStage.join(', '),
      lung_rads_category: localStorage.getItem('lungRadsCategory'),
      other_findings: this.otherFinding,
      imp: { ...this.IMP },
      input: localStorage.getItem('lastObservation'),
      filename: `${this.recordId.trim()}_${this.date}.json`
    };

    console.log('Saved JSON:', result);

    this.http.post('api/save-result', result).subscribe({
      next: data => console.log('存檔結果：', data),
      error: err => console.error('存檔失敗：', err)
    });

    this.http.post('https://n8n.fcubiolab.com/webhook/lung-report', result).subscribe({
      next: data => console.log('成功傳送至 n8n:', data),
      error: err => console.error('傳送失敗：', err)
    });


    alert('✅ 已成功儲存報告！');
  }

  before_saveForm() {

    const tumorLocation: string[] = [];
    if (this.locations.RUL) tumorLocation.push('RUL');
    if (this.locations.RML) tumorLocation.push('RML');
    if (this.locations.RLL) tumorLocation.push('RLL');
    if (this.locations.LUL) tumorLocation.push('LUL');
    if (this.locations.LLL) tumorLocation.push('LLL');
    if (this.locations.Other.trim()) tumorLocation.push(this.locations.Other.trim());

    const tStage = (Object.keys(this.T) as string[]).filter(k => this.T[k]);
    const nStage = (Object.keys(this.N) as string[]).filter(k => this.N[k]);
    const mStage = (Object.keys(this.M) as string[]).filter(k => this.M[k]);

    const result = {
      record_id: this.recordId.trim(),
      patient_name: this.patientName.trim(),
      patient_info: this.patientInfo.trim(),
      imaging_date: this.date,
      tumor_location: tumorLocation.join(', '),
      tumor_size_cm: this.size.type === 'Measurable' ? this.size.value : this.size.type,
      T_stage: tStage.join(', '),
      N_stage: nStage.join(', '),
      M_stage: mStage.join(', '),
      lung_rads_category: localStorage.getItem('lungRadsCategory'),
      other_findings: this.otherFinding,
      imp: { ...this.IMP },
      input: localStorage.getItem('lastObservation'),
      filename: `${this.recordId.trim()}_${this.date}.json`
    };

    console.log('Saved JSON:', result);

    this.http.post('api/save-before-result', result).subscribe({
      next: data => console.log('存檔結果：', data),
      error: err => console.error('存檔失敗：', err)
    });

    this.http.post('https://n8n.fcubiolab.com/webhook/lung-report', result).subscribe({
      next: data => console.log('成功傳送至 n8n:', data),
      error: err => console.error('傳送失敗：', err)
    });

  }

  // ---- 清空表單 ----
  clearForm() {
    this.recordId = '';
    this.patientName = '';
    this.patientInfo = '';
    this.date = '';
    this.modalities = { CT: false, MRI: false };
    this.locations = { RUL: false, RML: false, RLL: false, LUL: false, LLL: false, Other: '' };
    this.size = { type: '', value: '' };
    Object.keys(this.T).forEach(k => this.T[k] = false);
    Object.keys(this.N).forEach(k => this.N[k] = false);
    Object.keys(this.M).forEach(k => this.M[k] = false);
    this.otherFinding = '';
    this.IMP = { T: '', N: '', M: '' };

    this.router.navigate(['/report']); // 改成你表單頁的路由
  }

  // ---- 登出 ----
  find() {
    this.router.navigate(['/find']); // 改成你表單頁的路由
  }
}
