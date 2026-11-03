type ErrorNoticeProps = {
  message: string;
};

export default function ErrorNotice({ message }: ErrorNoticeProps) {
  return (
    <p role="alert" className="border-l-4 border-error-500 bg-error-50 px-4 py-3 text-sm text-error-700">
      {message}
    </p>
  );
}
