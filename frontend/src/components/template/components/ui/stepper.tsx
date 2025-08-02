import React, {
  useState,
  Children,
  useRef,
  useLayoutEffect,
  HTMLAttributes,
  ReactNode,
  useEffect,
} from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import LoadingText from "@/components/loading/LoadingText";

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  backButtonText?: string;
  nextButtonText?: string;
  disableStepIndicators?: boolean;
  validateStep?: (step: number) => boolean;
  hasStepErrors?: boolean;
  isLoading?: boolean;
  renderStepIndicator?: (props: {
    step: number;
    currentStep: number;
    onStepClick: (clicked: number) => void;
  }) => ReactNode;
}

const StepperComponent = ({
  children,
  initialStep = 1,
  onStepChange = () => { },
  onFinalStepCompleted = () => { },
  stepCircleContainerClassName = "",
  stepContainerClassName = "",
  contentClassName = "",
  footerClassName = "",
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = "上一步",
  nextButtonText = "下一步",
  disableStepIndicators = false,
  validateStep,
  hasStepErrors = false,
  isLoading = false,
  renderStepIndicator,
  ...rest
}: StepperProps) => {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [direction, setDirection] = useState<number>(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      // 如果有驗證函數，先進行驗證
      if (validateStep && !validateStep(currentStep)) {
        return; // 驗證失敗，阻止前進
      }
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div
      className="flex min-h-full flex-1 flex-col items-center justify-center p-4"
      {...rest}
    >
      <div
        className={`mx-auto w-full max-w-2xl rounded-lg shadow-xl border border-border ${stepCircleContainerClassName}`}
      >
        <div
          className={`${stepContainerClassName} flex w-full items-center p-6 sm:p-8`}
        >
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: (clicked) => {
                      // 如果是往前跳步驟，需要逐一驗證中間的步驟
                      if (clicked > currentStep && validateStep) {
                        for (let i = currentStep; i < clicked; i++) {
                          if (!validateStep(i)) {
                            return; // 驗證失敗，阻止跳轉
                          }
                        }
                      }
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    },
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={(clicked) => {
                      // 如果是往前跳步驟，需要逐一驗證中間的步驟
                      if (clicked > currentStep && validateStep) {
                        for (let i = currentStep; i < clicked; i++) {
                          if (!validateStep(i)) {
                            return; // 驗證失敗，阻止跳轉
                          }
                        }
                      }
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }}
                  />
                )}
                {isNotLastStep && (
                  <StepConnector isComplete={currentStep > stepNumber} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`space-y-2 px-6 sm:px-8 ${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={`px-6 sm:px-8 pb-6 sm:pb-8 ${footerClassName}`}>
            <div
              className={`mt-8 sm:mt-10 flex ${currentStep !== 1 ? "justify-between" : "justify-end"
                }`}
            >
              {currentStep !== 1 && (
                <button
                  onClick={handleBack}
                  className={`rounded px-4 py-2 text-sm font-medium transition duration-150 ease-in-out ${currentStep === 1
                    ? "pointer-events-none opacity-50 text-muted-foreground"
                    : "text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80"
                    }`}
                  {...backButtonProps}
                >
                  {backButtonText}
                </button>
              )}
              <button
                onClick={isLastStep ? handleComplete : handleNext}
                className={`group flex items-center justify-center rounded-md py-2 px-6 text-sm font-medium tracking-tight transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg ${hasStepErrors && !isLastStep
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 animate-pulse hover:shadow-destructive/25"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 hover:shadow-primary/25"
                  }`}
                {...nextButtonProps}
              >
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                  {hasStepErrors && !isLastStep
                    ? "請完成必填項目"
                    : isLastStep
                      ? "完成"
                      : nextButtonText
                  }
                </span>
                {!hasStepErrors && (
                  <svg
                    className="ml-2 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={isLastStep ? "M5 13l4 4L19 7" : "M9 5l7 7-7 7"}
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
        {isCompleted && (
          <div className="p-6 sm:p-8 text-center space-y-4">
            {isLoading ? (
              <>
                <LoadingText className="mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-primary">正在為您創建事務所</h3>
                  <p className="text-sm text-muted-foreground">請稍候，系統正在處理您的資料...</p>
                </div>
              </>
            ) : (
              <h3 className="text-xl font-semibold text-primary">所有步驟已完成！</h3>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface StepContentWrapperProps {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: ReactNode;
  className?: string;
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = "",
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState<number>(0);

  return (
    <motion.div
      style={{ position: "relative", overflow: "hidden" }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: "spring", duration: 0.4 }}
      className={className}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition
            key={currentStep}
            direction={direction}
            onHeightReady={(h) => setParentHeight(h)}
          >
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SlideTransitionProps {
  children: ReactNode;
  direction: number;
  onHeightReady: (height: number) => void;
}

function SlideTransition({
  children,
  direction,
  onHeightReady,
}: SlideTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight);
    }
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4 }}
      style={{ position: "absolute", left: 0, right: 0, top: 0, width: '100%' }}
    >
      {children}
    </motion.div>
  );
}

const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: "0%",
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

interface StepProps {
  children: ReactNode;
  className?: string;
}

const StepComponent = ({ children, className = "" }: StepProps) => {
  return <div className={`py-2 ${className}`}>{children}</div>;
};

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  onClickStep: (clicked: number) => void;
  disableStepIndicators?: boolean;
}

function StepIndicator({
  step,
  currentStep,
  onClickStep,
  disableStepIndicators = false,
}: StepIndicatorProps) {
  const status =
    currentStep === step
      ? "active"
      : currentStep < step
        ? "inactive"
        : "complete";

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step);
    }
  };

  const indicatorVariants: Variants = {
    inactive: { scale: 1, backgroundColor: "var(--muted)", color: "var(--muted-foreground)" },
    active: { scale: 1.1, backgroundColor: "var(--primary)", color: "var(--primary-foreground)" },
    complete: { scale: 1, backgroundColor: "var(--primary)", color: "var(--primary-foreground)" },
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`relative outline-none focus:outline-none ${!disableStepIndicators && step !== currentStep ? 'cursor-pointer' : 'cursor-default'}`}
      animate={status}
      initial={false}
      variants={indicatorVariants}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm"
      >
        {status === "complete" ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <span className="text-xs font-bold">{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

interface StepConnectorProps {
  isComplete: boolean;
}

function StepConnector({ isComplete }: StepConnectorProps) {
  const lineVariants: Variants = {
    incomplete: { width: 0, backgroundColor: "var(--muted)" },
    complete: { width: "100%", backgroundColor: "var(--primary)" },
  };

  return (
    <div className="relative mx-2 h-1 flex-1 overflow-hidden rounded bg-muted">
      <motion.div
        className="absolute left-0 top-0 h-full"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? "complete" : "incomplete"}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}

interface CheckIconProps extends React.SVGProps<SVGSVGElement> { }

function CheckIcon(props: CheckIconProps) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      viewBox="0 0 24 24"
    >
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1,
          type: "tween",
          ease: "easeOut",
          duration: 0.3,
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export { StepperComponent as Stepper, StepComponent as Step };