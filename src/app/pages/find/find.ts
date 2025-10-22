import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Report {
  created_at?: string;
  tumor_location?: string;
  tumor_size_cm?: string;
  T_stage?: string;
  N_stage?: string;
  M_stage?: string;
  lung_rads_category?: string;
  other_findings?: string;
  report_text?: string;
}

@Component({
  selector: 'app-find',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './find.html',
  styleUrls: ['./find.css']
})
export class FindComponent {
  N8N_BASE = "http://172.20.10.2:5678";
  QUERY_EP = `${this.N8N_BASE}/webhook/query-reports`;

  dateFrom: string = '';
  dateTo: string = '';
  reports: Report[] = [];
  message: string = '尚未查詢，請先輸入條件並按「查詢」。';

  constructor(private http: HttpClient) {}

  searchReports() {
    if (!this.dateFrom && !this.dateTo) {
      this.message = "請至少輸入一個日期。";
      this.reports = [];
      return;
    }

    const payload = { dateFrom: this.dateFrom, dateTo: this.dateTo };

    this.http.post<any>(this.QUERY_EP, payload).subscribe({
      next: data => {
        let rows: any[] = Array.isArray(data) ? data : (data.items || data.data || []);
        if (rows.length && rows[0]?.json) rows = rows.map(x => x.json);

        if (!rows.length) {
          this.reports = [];
          this.message = '未找到資料。';
        } else {
          this.reports = rows;
        }
      },
      error: err => {
        console.error(err);
        this.reports = [];
        this.message = "查詢失敗：" + (err.message || err.statusText);
      }
    });
  }

  resetFilters() {
    this.dateFrom = '';
    this.dateTo = '';
    this.reports = [];
    this.message = '尚未查詢，請先輸入條件並按「查詢」。';
  }
}
