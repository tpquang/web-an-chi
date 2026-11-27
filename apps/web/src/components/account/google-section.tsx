import { GoogleButton } from "./google-button";

// Lỗi từ luồng Google, web chuyển về trang đăng nhập kèm ?loi=
export const GOOGLE_ERRORS: Record<string, string> = {
  "google-tat": "Shop chưa bật đăng nhập bằng Google. Bạn đăng nhập bằng số điện thoại.",
  "google-het-han": "Phiên đăng nhập Google đã hết hạn. Bạn bấm Tiếp tục với Google lại.",
  "google-loi": "Chưa đăng nhập được bằng Google. Bạn thử lại sau ít phút hoặc dùng số điện thoại.",
};

// Khối "hoặc" + nút Google dưới form. Không có client id (shop chưa cấu hình) thì không hiện gì
export function GoogleSection({ clientId, next, error }: { clientId: string | null; next: string; error?: string }) {
  const message = error ? GOOGLE_ERRORS[error] : undefined;
  if (!clientId && !message) return null;
  return (
    <div className="mt-8 flex max-w-md flex-col gap-4">
      {message && (
        <p role="alert" className="text-sm text-err">
          {message}
        </p>
      )}
      {clientId && (
        <>
          <p className="flex items-center gap-3 text-sm text-ink-3 before:h-px before:flex-1 before:bg-edge after:h-px after:flex-1 after:bg-edge">hoặc</p>
          <GoogleButton next={next} />
        </>
      )}
    </div>
  );
}
