import ToastMessage from "./ToastMessage";

type Props = {
  message?: string;
};

export default function ErrorMessage({ message }: Props) {
  return <ToastMessage message={message} type="error" />;
}
