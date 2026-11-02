# Form: quy cách và khoảng cách

Các số dưới đây là bắt buộc. Form nào lệch thì sửa form, không đặt số mới.

## Ô nhập

Áp dụng cho `Input`, `Textarea`, trigger của `Select`, ô của `DatePicker`.

| Phần | Quy cách |
|---|---|
| Chiều cao | 44px. `Textarea` cao tối thiểu 96px |
| Padding ngang | 12px hai bên. **Không ô nào được có padding 0** |
| Padding dọc của `Textarea` | 10px |
| Có icon hoặc nút trong ô | Chừa 44px ở phía có icon, phía còn lại vẫn 12px |
| Chữ | 16px, sans 400 |
| Viền, bo góc, nền | 1px `--line-strong`, `rounded-md`, `--surface` |

- Chữ trong mọi ô cùng một form bắt đầu ở cùng một vị trí so với viền.
- Các ô và nút nằm trên cùng một hàng phải cao bằng nhau.
- Kiểu mặc định của ô phải tự đủ khi đứng một mình, không phụ thuộc vào class của form bao ngoài.

## Khoảng cách

| Giữa | Giá trị |
|---|---|
| Nhãn và ô | 6px |
| Ô và dòng gợi ý hoặc lỗi | 6px |
| Hai trường theo chiều dọc | 16px |
| Hai cột trong cùng hàng | 16px |
| Hai nhóm trường có tiêu đề | 32px |
| Tiêu đề nhóm và trường đầu tiên | 16px |
| Trường cuối và hàng nút | 24px |
| Hai nút cạnh nhau | 8px |
| Viền `Panel` và nội dung | 16px, từ 720px là 24px |

Khoảng cách đặt bằng `gap-*` ở khối cha. Không đặt `margin` trên từng trường.

## Checkbox và radio

| Phần | Quy cách |
|---|---|
| Ô chọn | 18×18px, `m-0`, `flex-none`, `accent-wood` |
| Ô chọn và nhãn | 8px |
| Chiều cao một dòng | Tối thiểu 44px, cả dòng bấm được |
| Hai lựa chọn cùng hàng | 16px |
| Hai lựa chọn xếp dọc | 0, vì mỗi dòng đã cao 44px |
| Mép trái | Thẳng mép trái của ô nhập phía trên |
| Chữ nhãn | 14px trở lên, căn giữa theo ô chọn |

Nhãn nhiều dòng thì ô chọn căn theo dòng đầu tiên.

## Bố cục

- Form dưới 720px một cột.
- Từ 720px chỉ xếp hai cột cho các trường ngắn có liên quan, như họ tên và điện thoại, tỉnh và quận. Địa chỉ và `Textarea` rộng hết hàng.
- Form đặt hàng dùng đúng `autocomplete` và `inputmode`: `tel` cho điện thoại, `street-address` cho địa chỉ.
- Số tiền nhập trong CMS có phân cách hàng nghìn, lưu số nguyên VND.

## Hàng nút

| Vị trí | Cách đặt |
|---|---|
| Form trong trang | Căn trái, nút chính đứng đầu |
| Modal | Căn phải, nút chính ngoài cùng bên phải |
| Dưới 480px | Nút chính rộng 100%, nút phụ nằm dưới |

Không căn giữa hàng nút. Không kéo nút phụ rộng bằng nút chính trên màn hình lớn.

## Tự kiểm tra

- [ ] Chữ trong ô không dính sát viền.
- [ ] Mọi ô cùng hàng cao bằng nhau, cùng bo góc.
- [ ] Mép trái của nhãn, ô, checkbox và nút thẳng hàng.
- [ ] Khoảng cách các trường đều nhau từ trên xuống.
- [ ] Đặt ô ra ngoài form vẫn đúng kiểu.
