import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Order, PaymentMethod, paymentMethodLabels, Customer, getAvailableCredit, calculateCreditLimit } from '@/types';
import { Banknote, CreditCard, Smartphone, Wallet, AlertTriangle } from 'lucide-react';

interface PaymentModalProps {
  order: Order;
  customer: Customer | undefined;
  open: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: PaymentMethod, paidAmount: number, creditUsed: number) => void;
}

const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="h-5 w-5" />,
  credit_card: <CreditCard className="h-5 w-5" />,
  debit_card: <CreditCard className="h-5 w-5" />,
  pix: <Smartphone className="h-5 w-5" />,
  credit_line: <Wallet className="h-5 w-5" />,
};

export const PaymentModal = ({ order, customer, open, onClose, onConfirm }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [useCredit, setUseCredit] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');

  const availableCredit = customer ? getAvailableCredit(customer) : 0;
  const creditLimit = customer ? calculateCreditLimit(customer) : 0;
  const maxCreditToUse = Math.min(availableCredit, order.total);
  
  const creditToUse = useCredit ? Math.min(parseFloat(creditAmount) || 0, maxCreditToUse) : 0;
  const remainingToPay = order.total - creditToUse;

  const handleConfirm = () => {
    if (paymentMethod === 'credit_line') {
      // Tudo no fiado
      onConfirm('credit_line', 0, order.total);
    } else if (useCredit && creditToUse > 0) {
      // Parte no fiado, parte no pagamento
      onConfirm(paymentMethod, remainingToPay, creditToUse);
    } else {
      // Pagamento normal
      onConfirm(paymentMethod, order.total, 0);
    }
    setPaymentMethod('cash');
    setUseCredit(false);
    setCreditAmount('');
  };

  const canUseCredit = customer && availableCredit > 0;
  const isFullCredit = paymentMethod === 'credit_line';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif">Finalizar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Total da Comanda */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total da Comanda</span>
              <span className="text-2xl font-bold text-primary">R$ {order.total.toFixed(2)}</span>
            </div>
          </Card>

          {/* Info do cliente e crédito */}
          {customer && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{customer.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Limite de Crédito</span>
                <span>R$ {creditLimit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Crédito Disponível</span>
                <Badge variant={availableCredit > 0 ? 'secondary' : 'destructive'}>
                  R$ {availableCredit.toFixed(2)}
                </Badge>
              </div>
            </div>
          )}

          {/* Método de Pagamento */}
          <div>
            <Label className="mb-3 block">Forma de Pagamento</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => {
                setPaymentMethod(v as PaymentMethod);
                if (v === 'credit_line') {
                  setUseCredit(false);
                }
              }}
              className="grid grid-cols-2 gap-2"
            >
              {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => {
                const isDisabled = method === 'credit_line' && (!canUseCredit || availableCredit < order.total);
                return (
                  <Label
                    key={method}
                    htmlFor={method}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${paymentMethod === method 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                      }
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <RadioGroupItem value={method} id={method} disabled={isDisabled} />
                    {paymentIcons[method]}
                    <span className="text-sm">{paymentMethodLabels[method]}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Usar crédito parcial */}
          {canUseCredit && !isFullCredit && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="useCredit"
                  checked={useCredit}
                  onChange={(e) => {
                    setUseCredit(e.target.checked);
                    if (!e.target.checked) setCreditAmount('');
                  }}
                  className="rounded border-border"
                />
                <Label htmlFor="useCredit" className="cursor-pointer">
                  Usar parte do crédito disponível
                </Label>
              </div>
              
              {useCredit && (
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={maxCreditToUse}
                    placeholder={`Máx: R$ ${maxCreditToUse.toFixed(2)}`}
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="bg-input border-border"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCreditAmount(maxCreditToUse.toString())}
                  >
                    Máx
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Resumo do pagamento */}
          {(useCredit && creditToUse > 0) && (
            <Card className="p-3 bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span>No Fiado</span>
                <span className="text-amber-500">R$ {creditToUse.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>A Pagar Agora ({paymentMethodLabels[paymentMethod]})</span>
                <span className="text-primary">R$ {remainingToPay.toFixed(2)}</span>
              </div>
            </Card>
          )}

          {isFullCredit && availableCredit < order.total && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              Crédito insuficiente para pagar toda a comanda no fiado.
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              className="flex-1 bg-gradient-primary"
              disabled={isFullCredit && availableCredit < order.total}
            >
              Confirmar Pagamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
