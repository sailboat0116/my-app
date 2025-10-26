import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report.html',
  styleUrls: ['./report.css']
})
export class ReportComponent {
  observation: string = '';
  result: string = '尚未產生結果';
  obsBadge: string = 'Ready';
  resultBadge: string = '等待輸出';
  isGenerating: boolean = false;

  constructor(private router: Router) {}

  // 字數統計
  get charCount(): number {
    return this.observation.length;
  }

  // Toast 提示
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
      zIndex: '9999',
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .25s'; }, 1200);
    setTimeout(() => { t.remove(); }, 1600);
  }

  // 輸入變化
  onInputChange() {
    if (!this.obsBadge || this.obsBadge === 'Ready') {
      this.obsBadge = 'Typing';
    }
  }

  // 清空輸入
  clearInput() {
    if (!this.observation) { this.toast('無需清空'); return; }
    if (confirm('確定要清空輸入內容？')) {
      this.observation = '';
      localStorage.removeItem('lastObservation');
      this.obsBadge = 'Ready';
      this.toast('已清空');
    }
  }

  // 複製觀察
  copyObservation() {
    navigator.clipboard.writeText(this.observation || '');
    this.obsBadge = '已複製';
    this.toast('已複製觀察文字');
  }

  // 複製結果
  copyResult() {
    navigator.clipboard.writeText(this.result || '');
    this.resultBadge = '已複製';
    this.toast('已複製結果文字');
  }

  // 儲存至 localStorage
  saveToLocal() {
    if (!this.result || this.result === '尚未產生結果' || this.result === '生成中…') {
      this.toast('目前沒有可儲存的結果');
      return;
    }
    localStorage.setItem('reportText', this.result);
    this.resultBadge = '已儲存';
    this.toast('已儲存至本機（reportText）');
  }

  // 返回填表
  goBack() {
    this.router.navigate(['/index']); // 改成你表單頁的路由
  }

  // 前往結果頁
  goToResponse() {
    if (this.result && this.result !== '尚未產生結果' && this.result !== '生成中…') {
      localStorage.setItem('reportText', this.result);
    }
    this.router.navigate(['/response']); // 改成你的結果頁路由
  }

  // 登出
  logout() {
    if (confirm('確定要登出嗎？')) {
      localStorage.removeItem('doctorAuth');
      this.router.navigate(['/login']); // 改成你的登入頁
    }
  }

  // 產生診斷報告
  async generateReport() {
    const obs = (this.observation || '').replace(/[\r\n]+/g, '').trim();
    if (!obs) {
      this.toast('請先輸入觀察內容');
      return;
    }

    if (this.isGenerating) {
      this.toast('系統正在處理中，請稍候…');
      return;
    }

    this.isGenerating = true;
    this.result = '生成中…';
    this.resultBadge = '處理中';
    localStorage.setItem('lastObservation', obs);

    try {
      const response = await fetch('https://n8n.fcubiolab.com/webhook/send-observation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observation: obs }),
      });
      const data = await response.json();
      console.log('Result from server:', data);

      this.result = data.response || data.error || '';

      if (data.form_data) {
        const formDataToSave = {
          ...data.form_data,
          imp: {
            T: data.form_data?.T_stage,
            N: data.form_data?.N_stage,
            M: data.form_data?.M_stage
          }
        };
        localStorage.setItem('generatedReport', JSON.stringify(formDataToSave));
        localStorage.setItem('reportText', data.response);

        // 延遲兩秒跳轉
        setTimeout(() => {
          if (
            data.form_data.benign_malignant?.toLowerCase() === 'benign' ||
            data.form_data.benign_malignant === '良性'
          ) {
            this.router.navigate(['/benign']);
          } else {
            this.router.navigate(['/response']);
          }
        }, 2000);
      }

      this.toast('生成完成 ✅');
    } catch (err) {
      console.error('Fetch error:', err);
      alert('資料送出失敗！');
    } finally {
      this.isGenerating = false;
      this.resultBadge = '完成';
    }
  }

  // 快捷鍵 Ctrl/Cmd+Enter 觸發送出
  handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.generateReport();
    }
  }

  // 初始化：載入暫存
  ngOnInit() {
    const savedObs = localStorage.getItem('lastObservation');
    if (savedObs) {
      this.observation = savedObs;
      this.obsBadge = 'Loaded';
    }

    const existing = localStorage.getItem('reportText');
    if (existing && existing.trim()) {
      this.result = existing;
      this.resultBadge = 'Loaded';
    }

    // 監聽 storage 更新（跨分頁保底）
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === 'reportText') {
        const v = e.newValue || '';
        if (v.trim()) {
          this.result = v;
          this.resultBadge = '已更新';
        }
      }
    });
  }
}
