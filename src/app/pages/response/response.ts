import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-response',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './response.html',
  styleUrls: ['./response.css']
})
export class ResponseComponent {
  reportText = '';
  formDataText = '';
  jsonStatus = '';
  previewBadge = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadFromLocalStorage();
  }

  // === toast ===
  toast(msg: string) {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
      position: 'fixed',
      left: '50%',
      top: '24px',
      transform: 'translateX(-50%)',
      background: '#111827',
      color: '#fff',
      padding: '10px 14px',
      borderRadius: '8px',
      boxShadow: '0 8px 24px rgba(0,0,0,.18)',
      zIndex: '9999'
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .25s'; }, 1200);
    setTimeout(() => { t.remove(); }, 1600);
  }

  loadFromLocalStorage() {
    const report = localStorage.getItem('reportText');
    const storedData = localStorage.getItem('generatedReport');

    if (report?.trim()) {
      this.reportText = report;
      this.previewBadge = 'Loaded';
    } else {
      this.reportText = '尚無報告內容';
      this.previewBadge = 'Empty';
    }

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        this.formDataText = JSON.stringify(parsed, null, 2);
        this.jsonStatus = '解析成功';
      } catch {
        this.formDataText = storedData;
        this.jsonStatus = '⚠️ JSON 解析錯誤';
      }
    } else {
      this.formDataText = '⚠️ 沒有可用的資料';
      this.jsonStatus = '空';
    }
  }

  copyReport() {
    navigator.clipboard.writeText(this.reportText).then(() => this.toast('已複製報告文字'));
  }

  downloadJSON() {
    let content = this.formDataText || '';
    try { JSON.parse(content); } catch { content = JSON.stringify({ raw: content }, null, 2); }
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generatedReport.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    this.toast('已下載 JSON');
  }

  copyJSON() {
    navigator.clipboard.writeText(this.formDataText).then(() => this.toast('已複製 JSON'));
  }

  validateJSON() {
    try {
      const obj = JSON.parse(this.formDataText || '');
      this.jsonStatus = '✅ 合法 JSON';
      this.toast('JSON 驗證成功');
      localStorage.setItem('generatedReport', JSON.stringify(obj));
    } catch {
      this.jsonStatus = '❌ 非合法 JSON';
      this.toast('JSON 驗證失敗，請檢查格式');
    }
  }

  back() {
    this.router.navigate(['/home']); // 或者路由設定的對應頁
  }

  nextPage() {
    try {
      const parsedData = JSON.parse(this.formDataText || '');
      localStorage.setItem('generatedReport', JSON.stringify(parsedData));
      localStorage.setItem('generatedReport_text', this.reportText);
      this.router.navigate(['/home']); // 導向下一頁
    } catch {
      alert('❌ 無法儲存資料，請確認格式是否正確！');
    }
  }

  print() {
    window.print();
  }

  logout() {
    if (confirm('確定要登出嗎？')) {
      localStorage.removeItem('doctorAuth');
      this.router.navigate(['/login']);
    }
  }
}
