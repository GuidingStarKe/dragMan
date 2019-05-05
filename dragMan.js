(function(global,factory){
    factory(global);//子函数自调用,防止全局变量污染
})(typeof window!==undefined?window:this,function(window){

    var DragMan = function(){
        this.pNode = '';//记录当前初始化拖拽父盒子
        this.tNode = '';//记录当前初始化拖拽目标盒子
        this.ExgRetNode = '/^\.+.*/';//监测是否是类名dom
        this.options = {
            baseIndex:200,//拖拽盒子基础z-index值，默认200

        }; //记录拖拽配置
        this.parentDomData = {'w':0,'h':0,'t':0,'l':0};//父dom的宽高
        this.targetDomData = [];//子dom集合，例：[{'node':{},'zIdx':0}]

        /**
         * [mergeOption 合并默认配置]
         */
        this.mergeOption = function(defaultOption,newOption){
            if(!newOption){return};
            for(var key in newOption){
                defaultOption[key] = newOption[key];
            }
        };


        /**
         * [reconfigObjDom 重构指定对象dom]
         */
        this.reconfigObjDom = function(data){
            var iNum = 0;//自定义对象索引值
            var resultArr = [];

            for(var i=0;i<data.length;i++){
                (function(idx){
                    var items = {
                        node:{},
                        zIdx:0
                    }
                    items.node = data[idx];
                    items.zIdx = idx;
                    resultArr.push(items);
                })(i)
            }

            return resultArr;
        }


        /**
         * [getDomData 获取缓存拖拽dom的所有数据]
         */
        this.getDomData = function(){
            var medDom = this.pNode;//获取dom方式可以优化
            this.targetDomData = this.reconfigObjDom(medDom.children);

            this.parentDomData['w'] = medDom.offsetWidth;
            this.parentDomData['h'] = medDom.offsetHeight;
            this.parentDomData['t'] = medDom.offsetTop;
            this.parentDomData['l'] = medDom.offsetLeft;

            this.bindDragEvent();
        }

        /**
         * [bindClickEvent  绑定点击事件(将目标层级设置最上层)]
         */
        this.bindClickEvent = function(){
            for(var i=0;i<this.targetDomData.length;i++){
                this.bindItemClickEvent(this.targetDomData[i])
            }
        }

        /**
         * [bindItemClickEvent  单个node节点绑定]
         * @param tItem dom节点+zIdx
         */
        this.bindItemClickEvent = function(tItem){
            var self = this;
            tItem.node.onclick = function(e){
                var event = e||window.e;
                //重新计算各个内嵌targetdom的zIdx
                var domZidx = Math.floor(this.getAttribute('data-zIdx'));
                console.log('每一次的索引值：'+domZidx);

                self.targetDomData.push(self.targetDomData.splice(domZidx,1)[0]);
                for(var i=0;i<self.targetDomData.length;i++){
                    (function(idxs){
                        self.targetDomData[i].zIdx = idxs;
                    })(i)
                    
                }
                console.log('监听点击事件值：'+JSON.stringify(self.targetDomData))
                self.setTargetDomIndex(self);
                
            }
        }

        /**
         * [setTargetDomIndex  设置内嵌拖动targetDom的层级]
         */
        this.setTargetDomIndex = function(self){
            var _this = self;
            for(var i=0;i<_this.targetDomData.length;i++){
                var item = _this.targetDomData[i];
                item.node.style.zIndex = item.zIdx;
                item.node.setAttribute('data-zIdx',item.zIdx);
            }
            console.log(JSON.stringify(_this.targetDomData));
        }


        /**
         * [bindClick 绑定盒子的拖拽事件]
         */
        this.bindDragEvent = function(){
            var self = this;
            for(var i=0;i<this.targetDomData.length;i++){
                var drag = this.targetDomData[i].node.firstElementChild;
                this.singleDragEvent(drag);
                
            }
        }


        /**
         * [singleDragEvent 单独的拖拽事件]
         * @param drag 需要绑定拖拽事件的dom节点
         */
        this.singleDragEvent = function(drag){
            drag.onmousedown = function(event){
                var event = event || window.event;  //兼容IE浏览器
                //    鼠标点击物体那一刻相对于物体左侧边框的距离=点击时的位置相对于浏览器最左边的距离-物体左边框相对于浏览器最左边的距离
                var diffX = event.clientX-self.parentDomData['l'] - drag.parentNode.offsetLeft;
                var diffY = event.clientY-self.parentDomData['t']- drag.parentNode.offsetTop;
                console.log('X:'+diffX+';Y:'+diffY);
                if(typeof drag.setCapture !== 'undefined'){
                        drag.setCapture(); 
                }
                document.onmousemove = function(event){
                    var event = event || window.event;

                    if(event.clientX-self.parentDomData['l']>self.parentDomData['w']||event.clientX<self.parentDomData['l']||event.clientY-self.parentDomData['t']>self.parentDomData['h']||event.clientY<self.parentDomData['t']){
                        this.onmousemove = null;
                        this.onmouseup = null;
                        //修复低版本ie bug  
                        if(typeof drag.releaseCapture!='undefined'){  
                            drag.releaseCapture();  
                        }  
                        return; 
                    }


                    var moveX = event.clientX-self.parentDomData['l'] - diffX;
                    var moveY = event.clientY-self.parentDomData['t'] - diffY;
                    
                    if(moveX < -drag.parentNode.offsetWidth){
                        moveX = -drag.parentNode.offsetWidth;
                    }else if(moveX > self.parentDomData['w']){
                        moveX = self.parentDomData['w'];
                    }
                    if(moveY < 0){
                        moveY = 0;
                    }else if(moveY > self.parentDomData['h']){
                        moveY =  self.parentDomData['h'];
                    }
                    drag.parentNode.style.left = moveX + 'px';
                    drag.parentNode.style.top = moveY + 'px';
                }
                document.onmouseup = function(event){
                    this.onmousemove = null;
                    this.onmouseup = null;
                    //修复低版本ie bug  
                    if(typeof drag.releaseCapture!='undefined'){  
                    drag.releaseCapture();  
                    }  
                }
            }
        }
        /**
         * [addDomWatch 添加dom增加减少的watch]
         */
        this.addDomWatch = function(){
            //监听dom增加
            var self = this;
            this.pNode.addEventListener('DOMNodeInserted',function(e){
                alert('dom增加节点：'+JSON.stringify(e));
                self.singleDragEvent()
            },false);

            //增加dom减少
            this.pNode.addEventListener('DOMNodeRemoved',function(e){
                alert('dom删除节点：'+JSON.stringify(e));
            },false);

        }
    };

    /**
     * [init 初始化拖拽函数]
     * @param parentNode 父盒子标签，现仅支持Id
     * @param targetNode 目标盒子标签
     * @param option 拖拽的功能配置文件
     */
    DragMan.prototype.init = function(parentNode,targetNode,option){
        this.pNode = document.getElementById(parentNode.slice(1));
        this.tNode = targetNode;
        this.mergeOption(this.options,option);//分析解析数据
        this.getDomData(parentNode);//初始化拖拽事件
        this.setTargetDomIndex(this);//初始化绑定每个targetDom的自定义z-index属性
        this.bindClickEvent();//初始化点击事件
        this.addDomWatch();//添加监听事件
    }

    window.DragMan = DragMan;
    return DragMan;
})
